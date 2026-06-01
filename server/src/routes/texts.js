import { Router } from 'express';
import { texts } from '../data/texts.js';

const router = Router();

// GET /api/texts — liste des métadonnées (sans systemPrompt ni analyse complète)
router.get('/', (req, res) => {
  const summary = texts.map(({ id, title, oeuvre, auteur, annee, mouvement }) => ({
    id, title, oeuvre, auteur, annee, mouvement,
  }));
  res.json(summary);
});

// GET /api/texts/:id — détail complet (sans systemPrompt)
router.get('/:id', (req, res) => {
  const text = texts.find(t => t.id === req.params.id);
  if (!text) return res.status(404).json({ error: 'Texte introuvable' });
  const { systemPrompt, ...safeText } = text;
  res.json(safeText);
});

export default router;
