import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { checkQuota } from '../middleware/quotaMiddleware.js';
import { chatWithGroq } from '../services/groqService.js';
import db from '../db/database.js';
import { texts } from '../data/texts.js';

const router = Router();

// GET /api/chat/quota — quota restant de l'utilisateur connecté
router.get('/quota', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT daily_quota, messages_used, last_reset FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const today = new Date().toISOString().split('T')[0];
  const used = user.last_reset !== today ? 0 : user.messages_used;

  res.json({
    quota: user.daily_quota,
    used,
    remaining: user.daily_quota - used,
  });
});

// GET /api/chat/:textId/history — historique de conversation pour un texte
router.get('/:textId/history', requireAuth, (req, res) => {
  const { textId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 60, 100);

  const rows = db.prepare(`
    SELECT role, content, created_at
    FROM messages_log
    WHERE user_id = ? AND text_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `).all(req.user.id, textId, limit);

  res.json({ history: rows });
});

// DELETE /api/chat/:textId/history — effacer l'historique d'un texte
router.delete('/:textId/history', requireAuth, (req, res) => {
  const { textId } = req.params;
  const info = db.prepare(
    'DELETE FROM messages_log WHERE user_id = ? AND text_id = ?'
  ).run(req.user.id, textId);

  res.json({ ok: true, deleted: info.changes });
});

const MARKDOWN_INSTRUCTIONS = `
FORMAT DE TES RÉPONSES (IMPORTANT) :
- Utilise le **Markdown** pour structurer tes réponses
- **Gras** pour les termes littéraires importants (procédés, auteurs, concepts)
- *Italique* pour les citations du texte
- ## Titre pour les grandes sections si ta réponse est longue
- - Listes à puces pour les énumérations (procédés, axes, étapes)
- > Citation pour reproduire un extrait du texte étudié
- Garde tes réponses claires, aérées, adaptées au niveau lycée`;

function generateSystemPromptForUserText(dbText) {
  let content = {};
  try {
    content = JSON.parse(dbText.content_json);
  } catch (e) {
    content = {};
  }
  
  const movements = content.analyseLineaire
    ? content.analyseLineaire.map((m, i) => `${i + 1}. Mouvement: ${m.passage ? m.passage.substring(0, 80) : ''}... Analyse: ${m.analyse}`).join('\n')
    : '';

  const processes = content.procedesStyliques
    ? content.procedesStyliques.map(p => `- ${p.procede}: "${p.exemple}" (Effet: ${p.effet})`).join('\n')
    : '';

  const axes = content.axesLecture
    ? content.axesLecture.map((a, i) => `${i + 1}. ${a}`).join('\n')
    : '';

  return `Tu es M. Marin, un professeur de français bienveillant, pédagogique et exigeant. Tu es spécialiste du texte "${content.title || dbText.title}" de ${content.auteur || dbText.auteur}, extrait de "${content.oeuvre || dbText.oeuvre}" (${content.annee || dbText.annee || 'Année inconnue'}).

Tu aides un élève de Première Générale à préparer son oral de Bac de Français.

TES CAPACITÉS :
- Expliquer un passage ou une expression du texte
- Identifier et nommer les procédés stylistiques avec leur effet
- Aider à formuler une réponse claire à une question d'examinateur
- Simuler un oral du bac (poser des questions comme un examinateur)
- Rappeler les axes de lecture et la problématique

TES RÈGLES :
- Réponds UNIQUEMENT aux questions liées à ce texte et au bac de français
- Ne fais PAS le travail à la place de l'élève : guide, questionne, suggère
- Sois encourageant, précis, adapté au niveau lycée (Première Générale)

FICHE DU TEXTE :
Auteur : ${content.auteur || dbText.auteur}
Œuvre : ${content.oeuvre || dbText.oeuvre}
Mouvement : ${content.mouvement || dbText.mouvement || 'Aucun'}
Année : ${content.annee || dbText.annee || 'Inconnue'}
Introduction : ${content.introduction || ''}
Résumé : ${content.resume || ''}
Conclusion : ${content.conclusion || ''}

MOUVEMENTS D'ANALYSE :
${movements}

PROCÉDÉS CLÉS :
${processes}

AXES :
${axes}

${MARKDOWN_INSTRUCTIONS}`;
}

// POST /api/chat/:textId — envoyer un message à l'IA pour ce texte
router.post('/:textId', requireAuth, checkQuota, async (req, res) => {
  const { textId } = req.params;
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Tableau messages[] manquant ou vide' });
  }

  let systemPrompt = '';
  const text = texts.find(t => t.id === textId);
  if (text) {
    systemPrompt = text.systemPrompt;
  } else {
    // Check if it's a user text
    const dbText = db.prepare(`
      SELECT * FROM user_texts 
      WHERE slug = ? AND (
        user_id = ? OR is_public = 1 OR id IN (
          SELECT text_id FROM text_shares WHERE to_user_id = ?
        )
      )
    `).get(textId, req.user.id, req.user.id);
    
    if (!dbText) return res.status(404).json({ error: 'Texte introuvable ou accès non autorisé' });
    
    systemPrompt = generateSystemPromptForUserText(dbText);
  }

  // Récupérer les 30 derniers messages en DB pour le contexte Groq (vraie mémoire persistante)
  const dbHistory = db.prepare(`
    SELECT role, content FROM messages_log
    WHERE user_id = ? AND text_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `).all(req.user.id, textId).reverse();

  // Message utilisateur (dernier message du tableau envoyé)
  const userMsg = messages[messages.length - 1];
  if (!userMsg || userMsg.role !== 'user') {
    return res.status(400).json({ error: 'Le dernier message doit être de role "user"' });
  }

  // Construire le contexte : historique DB + nouveau message user
  const context = [...dbHistory, { role: userMsg.role, content: userMsg.content }];

  try {
    const reply = await chatWithGroq(systemPrompt, context);

    // Logger le message user ET la réponse assistant
    const insertMsg = db.prepare(
      'INSERT INTO messages_log (user_id, text_id, role, content) VALUES (?, ?, ?, ?)'
    );
    insertMsg.run(req.user.id, textId, 'user', userMsg.content);
    insertMsg.run(req.user.id, textId, 'assistant', reply);

    // Incrémenter le compteur de quota
    db.prepare('UPDATE users SET messages_used = messages_used + 1 WHERE id = ?').run(req.user.id);

    const updated = db.prepare('SELECT messages_used, daily_quota FROM users WHERE id = ?').get(req.user.id);
    res.json({
      reply,
      quotaRemaining: updated.daily_quota - updated.messages_used,
    });
  } catch (err) {
    if (err.message?.includes('saturées')) {
      return res.status(503).json({ error: err.message });
    }
    console.error('Erreur Groq:', err);
    res.status(500).json({ error: "Erreur lors de la communication avec l'IA" });
  }
});

export default router;
