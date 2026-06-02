import { Router } from 'express';
import db from '../db/database.js';
import bcrypt from 'bcrypt';

const router = Router();
const SALT_ROUNDS = 12;

// Middleware pour vérifier le code secret admin
const requireAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret) {
    return res.status(500).json({ error: "Le mode administrateur n'est pas configuré sur le serveur (ADMIN_SECRET manquant)." });
  }

  if (secret !== expectedSecret) {
    return res.status(401).json({ error: "Code secret administrateur invalide." });
  }

  next();
};

// GET /api/admin/users : liste tous les élèves
router.get('/users', requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, classe, daily_quota, messages_used, last_reset, texts_created_today, created_at 
      FROM users
      ORDER BY created_at DESC
    `).all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des élèves." });
  }
});

// POST /api/admin/users/:id/reset-password : change le mot de passe d'un élève
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit faire au moins 8 caractères." });
  }

  try {
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const info = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Élève introuvable." });
    }

    res.json({ ok: true, message: "Mot de passe mis à jour avec succès." });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour." });
  }
});

// POST /api/admin/users/:id/reset-quota : remet à zéro les quotas du jour pour un élève
router.post('/users/:id/reset-quota', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare('UPDATE users SET messages_used = 0, texts_created_today = 0 WHERE id = ?').run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Élève introuvable." });
    }

    res.json({ ok: true, message: "Quotas réinitialisés avec succès." });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// DELETE /api/admin/users/:id : supprime un compte élève (cascade supprime ses messages et textes)
router.delete('/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Élève introuvable." });
    }

    res.json({ ok: true, message: "Compte supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

export default router;
