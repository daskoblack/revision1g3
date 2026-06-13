import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import db from '../db/database.js';
import { chatWithGroq, analyzeImageWithGroq } from '../services/groqService.js';
import crypto from 'crypto';

const router = Router();

// Route POST /create : soumet l'image, vérifie le quota, extrait le texte, et génère la fiche
router.post('/create', requireAuth, async (req, res) => {
  const { imageBase64, mimeType, classe, title, auteur, oeuvre, isPublic, force, generatedData } = req.body;

  // Garde-fou global : toute erreur DB renvoie une 500 propre au lieu de crasher le process
  try {
  // 1. Si on a déjà les données générées (suite à la confirmation d'un doublon)
  if (generatedData) {
    const today = new Date().toISOString().split('T')[0];
    const user = db.prepare('SELECT texts_created_today, texts_last_reset FROM users WHERE id = ?').get(req.user.id);
    
    let textsCreatedToday = user.texts_created_today;
    if (user.texts_last_reset !== today) {
      db.prepare('UPDATE users SET texts_created_today = 0, texts_last_reset = ? WHERE id = ?').run(today, req.user.id);
      textsCreatedToday = 0;
    }

    if (textsCreatedToday >= 2) {
      return res.status(403).json({ error: "Tu as atteint ta limite de 2 créations de texte par jour. Reviens demain ! 🌙" });
    }

    const cleanTitle = (generatedData.title || 'texte')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${cleanTitle}-${crypto.randomBytes(4).toString('hex')}`;
    const shareToken = crypto.randomBytes(16).toString('hex');
    const isPub = isPublic ? 1 : 0;

    db.prepare(`
      INSERT INTO user_texts (user_id, slug, title, oeuvre, auteur, annee, mouvement, classe, content_json, is_public, share_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      slug,
      generatedData.title,
      generatedData.oeuvre,
      generatedData.auteur,
      generatedData.annee || '',
      generatedData.mouvement || '',
      classe || req.user.classe || 'Toutes',
      JSON.stringify(generatedData),
      isPub,
      shareToken
    );

    // Incrémenter le quota
    db.prepare('UPDATE users SET texts_created_today = texts_created_today + 1 WHERE id = ?').run(req.user.id);

    return res.status(201).json({ slug, text: generatedData });
  }

  // 2. Validation des paramètres d'image
  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "Image sous format Base64 et type MIME requis." });
  }

  const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validMimes.includes(mimeType)) {
    return res.status(400).json({ error: "Format d'image non supporté (JPEG, PNG, WEBP uniquement)." });
  }

  // Estimer la taille du base64 (~3/4 de la longueur de la chaîne)
  const sizeInBytes = (imageBase64.length * 3) / 4;
  if (sizeInBytes > 10 * 1024 * 1024) {
    return res.status(400).json({ error: "L'image ne doit pas dépasser 10 Mo." });
  }

  // 3. Vérification du quota
  const today = new Date().toISOString().split('T')[0];
  const user = db.prepare('SELECT texts_created_today, texts_last_reset FROM users WHERE id = ?').get(req.user.id);
  
  let textsCreatedToday = user.texts_created_today;
  if (user.texts_last_reset !== today) {
    db.prepare('UPDATE users SET texts_created_today = 0, texts_last_reset = ? WHERE id = ?').run(today, req.user.id);
    textsCreatedToday = 0;
  }

  if (textsCreatedToday >= 2) {
    return res.status(403).json({ error: "Tu as atteint ta limite de 2 créations de texte par jour. Reviens demain ! 🌙" });
  }

    // 4. Extraction du texte via Groq Vision
    const ocrPrompt = `Extrais l'intégralité du texte littéraire présent sur cette image. Si ce n'est pas un texte littéraire (par exemple: une photo de paysage, un objet, un graphique, une formule mathématique, un texte scientifique ou administratif, une facture, etc.), commence obligatoirement ta réponse par le mot 'INVALID:' suivi d'une explication courte en français (1 ou 2 sentences) expliquant pourquoi ce n'est pas un texte littéraire admissible. Sinon, renvoie uniquement le texte littéraire retranscrit fidèlement mot à mot, sans aucun commentaire ni introduction.`;
    
    let extractedResult;
    try {
      extractedResult = await analyzeImageWithGroq(ocrPrompt, imageBase64, mimeType);
    } catch (err) {
      console.error("❌ Erreur OCR (vision Groq):", err.status, err.message);
      return res.status(500).json({ error: "Impossible de lire l'image (service vision indisponible). Réessaie dans 30s.", details: err.message });
    }

    if (!extractedResult || extractedResult.trim().length < 10) {
      return res.status(400).json({ error: "Aucun texte lisible détecté sur l'image. Prends une photo plus nette." });
    }

    if (extractedResult.startsWith('INVALID:')) {
      return res.status(400).json({ error: extractedResult.replace('INVALID:', '').trim() });
    }

    // 5. Génération de la fiche d'analyse au format JSON
    const structPrompt = `Tu es M. Marin, professeur de français expert (niveau exigé : 17/20 à l'oral du Bac). Analyse ce texte littéraire et retourne UNIQUEMENT un JSON valide (aucun markdown, aucun texte hors du JSON).

Métadonnées fournies par l'élève : titre="${title || ''}", auteur="${auteur || ''}", oeuvre="${oeuvre || ''}". Utilise-les si elles sont cohérentes avec le texte.

════════════════════════
🛑 ÉTAPE 0 — VÉRIFICATION DU TEXTE SOURCE (NUANCÉE)
════════════════════════
Avant toute analyse, classe le texte :
• CAS A — Texte difficile mais LÉGITIME : ellipses, syntaxe ancienne, vers, ponctuation déroutante, vocabulaire rare, ambiguïté volontaire (fréquent en théâtre, poésie, XVIe-XIXe siècle). NE PAS bloquer : analyse ces traits comme des éléments stylistiques à part entière (ex : "cette syntaxe heurtée traduit...").
• CAS B — Texte incohérent/corrompu : mots inexistants dans tout dictionnaire français, associations ne formant aucun sens même figuré, incohérences ressemblant à une génération automatique défaillante.
  → Dans CE cas SEULEMENT, ne produis PAS la fiche : retourne EXACTEMENT {"invalid": true, "raison": "indique quels passages semblent non authentiques et pourquoi"}.
En cas de doute entre A et B : choisis A et propose une analyse conditionnelle ("si ce terme signifie X, alors...").

════════════════════════
⚠️ RÈGLE ABSOLUE
════════════════════════
- Aucune invention de contenu. Aucune interprétation non justifiée par le texte.
- Ne jamais corriger ni "réinventer" le texte.
- Si un passage est ambigu → le signaler explicitement dans l'explication (mais l'analyser quand même si CAS A).

════════════════════════
📖 MÉTHODE OBLIGATOIRE POUR CHAQUE PROCÉDÉ (niveau 17/20)
════════════════════════
Le champ "citation" = la citation exacte et COURTE.
Le champ "explication" DOIT contenir, dans l'ordre et de façon substantielle (pas de phrase creuse), ces 3 étapes :
1) OBSERVATION FACTUELLE : nomme PRÉCISÉMENT le procédé visible (anaphore, antithèse, rythme ternaire, modalisateur, champ lexical, type de phrase, énonciation, temps verbal, sonorité, versification…).
2) MÉCANISME (étape centrale, JAMAIS sautée) : explique COMMENT ce procédé produit concrètement son effet (comment il agit sur le sens et le lecteur), pas seulement ce qu'il est.
   ❌ Interdit (circulaire) : "le lexique du désaccord montre une opposition".
   ✅ Attendu : "la succession de phrases négatives courtes crée un rythme heurté qui mime, au niveau syntaxique, le refus catégorique du personnage — la forme reproduit le fond".
3) INTERPRÉTATION : ce que ce mécanisme révèle sur le sens global, le personnage ou l'enjeu du passage, strictement ancré dans le texte et relié à la problématique.
INTERDICTION de sauter de l'observation à l'interprétation sans le MÉCANISME (étape 2 non négociable).

════════════════════════
🎯 TEST ANTI-SUPERFICIALITÉ (à appliquer à chaque analyse)
════════════════════════
Demande-toi : "Si je remplaçais cette citation par une autre du même type, mon explication resterait-elle vraie mot pour mot ?" Si OUI → elle est trop générique : reformule en l'ancrant dans les mots EXACTS de cette citation.

════════════════════════
🚫 INTERDITS STRICTS
════════════════════════
- Listes de procédés sans analyse ; paraphrase du texte ; sur-interprétation.
- Vocabulaire vague ("intéressant", "important", "efficace", "montre que", "souligne") employé sans préciser le COMMENT.
- Connaissances extérieures non fournies ; analyse "passe-partout" applicable à n'importe quel texte.

STRUCTURE JSON OBLIGATOIRE (uniquement si CAS A) :
{
  "title": "Titre du texte",
  "oeuvre": "Recueil/Roman/Pièce",
  "auteur": "Nom complet",
  "annee": "Année (ex: 1870)",
  "mouvement": "Mouvement littéraire",
  "contexteAuteur": "Biographie courte (3-4 phrases)",
  "contexteOeuvre": "Contexte de l'oeuvre/extrait (3-4 phrases)",
  "resume": "Résumé court du passage (3-4 phrases)",
  "problematique": "UNE problématique précise, formulée EN TENSION (pas une simple description)",
  "introduction": "Intro type Bac : auteur+œuvre, situation du passage, problématique, annonce des mouvements",
  "conclusion": "Réponse claire à la problématique + bilan de ce que les procédés révèlent ENSEMBLE + ouverture courte",
  "analyseLineaire": [
    {
      "titre": "Mouvement 1 : titre du mouvement",
      "ideePrincipale": "Idée directrice du mouvement (doit PROGRESSER par rapport au précédent, pas de redite)",
      "procedes": [
        {"titre": "🔍 Nom du procédé (avec emoji)", "citation": "Citation EXACTE et courte", "explication": "OBSERVATION + MÉCANISME + INTERPRÉTATION (les 3 étapes développées)"}
      ]
    }
  ],
  "procedesStyliques": [
    {"procede": "Nom du procédé", "exemple": "Citation", "effet": "Effet précis"}
  ],
  "problematiquesPossibles": ["Question d'examen 1", "Question d'examen 2"],
  "axesLecture": ["Axe 1", "Axe 2"],
  "mnemo": ["Astuce mnémotechnique (avec emoji)", "Astuce 2"]
}

CONTRAINTES DE DÉVELOPPEMENT :
- 2 à 3 mouvements MAXIMUM ; chacun avec 3 à 4 procédés analysés par la méthode complète.
- Chaque mouvement a une idée directrice qui progresse (pas de redite).
- Citations copiées MOT À MOT depuis le texte ci-dessous.

CONTRÔLE FINAL avant de répondre : texte classé A ou B ; toutes les citations existent dans le texte ; chaque "explication" contient bien le MÉCANISME explicite ; aucune généralisation non prouvée ; test anti-superficialité appliqué.

TEXTE À ANALYSER :
${extractedResult}`;

    let reply;
    try {
      reply = await chatWithGroq(
        "Retourne UNIQUEMENT du JSON valide, sans markdown, sans explications.",
        [{ role: 'user', content: structPrompt }],
        { maxTokens: 8000, temperature: 0.3 } // fiche riche = sortie volumineuse
      );
    } catch (err) {
      console.error("Erreur appel Groq (struct):", err.message);
      return res.status(500).json({ error: "Erreur lors de l'appel à l'IA. Réessaie dans 30s.", details: err.message });
    }

    // Extraction robuste : isoler le JSON entre la première { et la dernière }
    let cleanJson = reply.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
    }

    let parsedData = {};
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (err) {
      console.error("❌ JSON parse failed. Raw reply (fin):", reply.slice(-300));
      return res.status(500).json({
        error: "L'IA a renvoyé un format incomplet (texte peut-être trop long). Réessaie.",
        details: err.message
      });
    }

    // CAS B (étape 0) : l'IA juge le texte incohérent/corrompu → on signale à l'élève
    if (parsedData.invalid) {
      return res.status(400).json({
        error: parsedData.raison
          ? `Le texte ne semble pas authentique : ${parsedData.raison}`
          : "Le texte photographié semble incohérent ou illisible. Reprends une photo plus nette d'un vrai texte littéraire."
      });
    }

    // Valider les champs obligatoires
    const required = ['title', 'auteur', 'oeuvre', 'analyseLineaire', 'procedesStyliques'];
    for (const field of required) {
      if (!parsedData[field]) {
        console.error(`❌ Missing required field: ${field}`);
        return res.status(500).json({ error: `Champ manquant: ${field}. Réessaie.` });
      }
    }

    // Assurer que analyseLineaire est un tableau
    if (!Array.isArray(parsedData.analyseLineaire) || parsedData.analyseLineaire.length === 0) {
      console.error("❌ analyseLineaire is not a valid array");
      return res.status(500).json({ error: "Analyse linéaire invalide. Réessaie." });
    }

    // Forcer le texte complet avec l'OCR exact (plus fiable que la transcription IA)
    parsedData.texteComplet = extractedResult.trim();

    // 6. Vérification de doublon
    if (isPublic && !force) {
      const duplicate = db.prepare(`
        SELECT id, slug 
        FROM user_texts 
        WHERE LOWER(auteur) = LOWER(?) AND LOWER(title) = LOWER(?) AND is_public = 1 
        LIMIT 1
      `).get(parsedData.auteur, parsedData.title);

      if (duplicate) {
        return res.json({
          warning: `Un texte similaire ("${parsedData.title}" de ${parsedData.auteur}) existe déjà dans les textes de classe. Veux-tu quand même créer ta propre version ?`,
          generatedData: parsedData
        });
      }
    }

    // 7. Enregistrement en DB
    const cleanTitle = (parsedData.title || 'texte')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${cleanTitle}-${crypto.randomBytes(4).toString('hex')}`;
    const shareToken = crypto.randomBytes(16).toString('hex');
    const isPub = isPublic ? 1 : 0;

    db.prepare(`
      INSERT INTO user_texts (user_id, slug, title, oeuvre, auteur, annee, mouvement, classe, content_json, is_public, share_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      slug,
      parsedData.title,
      parsedData.oeuvre,
      parsedData.auteur,
      parsedData.annee || '',
      parsedData.mouvement || '',
      classe || req.user.classe || 'Toutes',
      JSON.stringify(parsedData),
      isPub,
      shareToken
    );

    // Incrémenter le quota
    db.prepare('UPDATE users SET texts_created_today = texts_created_today + 1 WHERE id = ?').run(req.user.id);

    res.status(201).json({ slug, text: parsedData });
  } catch (err) {
    console.error("Erreur de création de texte:", err);
    res.status(500).json({
      error: "Erreur technique lors de la création de la fiche d'analyse.",
      details: err.message
    });
  }
});

// GET /mine : textes créés par l'utilisateur connecté
router.get('/mine', requireAuth, (req, res) => {
  const texts = db.prepare(`
    SELECT id, slug, title, oeuvre, auteur, annee, mouvement, classe, is_public, share_token, created_at
    FROM user_texts
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);
  res.json({ texts });
});

// GET /shared : textes reçus en partage par d'autres utilisateurs
router.get('/shared', requireAuth, (req, res) => {
  const texts = db.prepare(`
    SELECT t.id, t.slug, t.title, t.oeuvre, t.auteur, t.annee, t.mouvement, t.classe, t.created_at, 
           u.username as shared_by, s.seen, s.created_at as shared_at
    FROM user_texts t
    JOIN text_shares s ON t.id = s.text_id
    JOIN users u ON s.from_user_id = u.id
    WHERE s.to_user_id = ?
    ORDER BY s.created_at DESC
  `).all(req.user.id);
  res.json({ texts });
});

// GET /all : textes publics (espace classe) filtrables par classe et recherche
router.get('/all', requireAuth, (req, res) => {
  const { classe, search } = req.query;
  
  let query = `
    SELECT t.id, t.slug, t.title, t.oeuvre, t.auteur, t.annee, t.mouvement, t.classe, t.created_at, u.username as creator
    FROM user_texts t
    JOIN users u ON t.user_id = u.id
    WHERE t.is_public = 1
  `;
  const params = [];

  if (classe && classe !== 'Toutes') {
    query += ` AND t.classe = ?`;
    params.push(classe);
  }

  if (search) {
    query += ` AND (t.title LIKE ? OR t.auteur LIKE ? OR t.oeuvre LIKE ?)`;
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal);
  }

  query += ` ORDER BY t.created_at DESC`;

  const texts = db.prepare(query).all(...params);
  res.json({ texts });
});

// GET /by-share-token/:token : accès anonyme en lecture seule à un texte via son token de partage
router.get('/by-share-token/:token', (req, res) => {
  const { token } = req.params;
  const text = db.prepare(`
    SELECT t.*, u.username as creator
    FROM user_texts t
    JOIN users u ON t.user_id = u.id
    WHERE t.share_token = ?
  `).get(token);

  if (!text) {
    return res.status(404).json({ error: "Lien de partage invalide ou expiré." });
  }

  res.json({ text });
});

// POST /accept-share/:token : ajouter le texte de partage à son historique personnel
router.post('/accept-share/:token', requireAuth, (req, res) => {
  const { token } = req.params;
  const text = db.prepare('SELECT * FROM user_texts WHERE share_token = ?').get(token);
  
  if (!text) return res.status(404).json({ error: "Texte de partage introuvable." });

  if (text.user_id === req.user.id) {
    return res.json({ ok: true, message: "Ce texte est déjà dans votre historique (vous en êtes le créateur)." });
  }

  const existingShare = db.prepare('SELECT id FROM text_shares WHERE text_id = ? AND to_user_id = ?').get(text.id, req.user.id);
  if (existingShare) {
    return res.json({ ok: true, message: "Ce texte est déjà dans vos partages." });
  }

  db.prepare('INSERT INTO text_shares (text_id, from_user_id, to_user_id, seen) VALUES (?, ?, ?, 1)')
    .run(text.id, text.user_id, req.user.id);

  res.json({ ok: true, message: "Texte ajouté à vos partages avec succès." });
});

// POST /mark-seen/:id : marquer un texte partagé comme vu
router.post('/mark-seen/:id', requireAuth, (req, res) => {
  db.prepare('UPDATE text_shares SET seen = 1 WHERE text_id = ? AND to_user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// GET /:slug : détail d'un texte (perso, public ou partagé)
router.get('/:slug', requireAuth, (req, res) => {
  const { slug } = req.params;

  const text = db.prepare(`
    SELECT t.*, u.username as creator
    FROM user_texts t
    JOIN users u ON t.user_id = u.id
    WHERE t.slug = ? AND (
      t.user_id = ? OR t.is_public = 1 OR t.id IN (
        SELECT text_id FROM text_shares WHERE to_user_id = ?
      )
    )
  `).get(slug, req.user.id, req.user.id);

  if (!text) {
    return res.status(404).json({ error: "Texte introuvable ou accès non autorisé." });
  }

  res.json({ text });
});

// DELETE /:slug : supprimer un texte personnel
router.delete('/:slug', requireAuth, (req, res) => {
  const { slug } = req.params;
  const text = db.prepare('SELECT id, user_id FROM user_texts WHERE slug = ?').get(slug);

  if (!text) return res.status(404).json({ error: "Texte introuvable." });
  if (text.user_id !== req.user.id) return res.status(403).json({ error: "Vous n'avez pas le droit de supprimer ce texte." });

  db.prepare('DELETE FROM user_texts WHERE id = ?').run(text.id);
  res.json({ ok: true, message: "Texte supprimé avec succès." });
});

// POST /:slug/share : partager directement avec un nom d'utilisateur
router.post('/:slug/share', requireAuth, (req, res) => {
  const { slug } = req.params;
  const { toUsername } = req.body;

  if (!toUsername) return res.status(400).json({ error: "Nom d'utilisateur destinataire requis." });
  const targetUsername = toUsername.trim().toLowerCase();

  const text = db.prepare('SELECT id, user_id FROM user_texts WHERE slug = ?').get(slug);
  if (!text) return res.status(404).json({ error: "Texte introuvable." });
  if (text.user_id !== req.user.id) return res.status(403).json({ error: "Vous n'êtes pas propriétaire de ce texte." });

  const recipient = db.prepare('SELECT id FROM users WHERE username = ?').get(targetUsername);
  if (!recipient) return res.status(404).json({ error: "L'utilisateur destinataire n'existe pas." });
  if (recipient.id === req.user.id) return res.status(400).json({ error: "Vous ne pouvez pas partager un texte avec vous-même." });

  const existing = db.prepare('SELECT id FROM text_shares WHERE text_id = ? AND to_user_id = ?').get(text.id, recipient.id);
  if (existing) return res.status(409).json({ error: "Ce texte est déjà partagé avec cet utilisateur." });

  db.prepare('INSERT INTO text_shares (text_id, from_user_id, to_user_id) VALUES (?, ?, ?)')
    .run(text.id, req.user.id, recipient.id);

  res.json({ ok: true, message: `Texte partagé avec succès avec @${toUsername}` });
});

// POST /:slug/toggle-public : modifier la visibilité d'un texte personnel (public/privé)
router.post('/:slug/toggle-public', requireAuth, (req, res) => {
  const { slug } = req.params;
  const { is_public } = req.body;

  const text = db.prepare('SELECT id, user_id FROM user_texts WHERE slug = ?').get(slug);
  if (!text) return res.status(404).json({ error: "Texte introuvable." });
  if (text.user_id !== req.user.id) return res.status(403).json({ error: "Vous n'êtes pas propriétaire de ce texte." });

  db.prepare('UPDATE user_texts SET is_public = ? WHERE id = ?').run(is_public ? 1 : 0, text.id);
  res.json({ ok: true, is_public: is_public ? 1 : 0 });
});

export default router;
