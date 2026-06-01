import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';

const router = Router();
const SALT_ROUNDS = 12;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Pseudo et mot de passe requis' });
  }
  const pseudo = username.trim().toLowerCase();
  if (pseudo.length < 3) {
    return res.status(400).json({ error: 'Le pseudo doit faire au moins 3 caractères' });
  }
  if (pseudo.length > 30) {
    return res.status(400).json({ error: 'Le pseudo ne peut pas dépasser 30 caractères' });
  }
  if (!/^[a-z0-9._-]+$/.test(pseudo)) {
    return res.status(400).json({ error: 'Pseudo invalide (lettres, chiffres, . _ - uniquement)' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Mot de passe trop court (minimum 8 caractères)' });
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    ).run(pseudo, hash);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username: pseudo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, username: pseudo });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Ce pseudo est déjà pris' });
    }
    console.error('Erreur register:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Pseudo et mot de passe requis' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, username: user.username });
});

export default router;
