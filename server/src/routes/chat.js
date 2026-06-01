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

// POST /api/chat/:textId — envoyer un message à l'IA pour ce texte
router.post('/:textId', requireAuth, checkQuota, async (req, res) => {
  const { textId } = req.params;
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Tableau messages[] manquant ou vide' });
  }

  // Limiter à 10 messages de contexte pour contrôler la taille des requêtes
  const context = messages.slice(-10).filter(
    m => m.role && m.content && typeof m.content === 'string'
  );

  const text = texts.find(t => t.id === textId);
  if (!text) return res.status(404).json({ error: 'Texte introuvable' });

  try {
    const reply = await chatWithGroq(text.systemPrompt, context);

    // Incrémenter le compteur et logger
    db.prepare('UPDATE users SET messages_used = messages_used + 1 WHERE id = ?').run(req.user.id);
    db.prepare(
      'INSERT INTO messages_log (user_id, text_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, textId, 'assistant', reply);

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
