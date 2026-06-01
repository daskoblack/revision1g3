import db from '../db/database.js';

export function checkQuota(req, res, next) {
  const userId = req.user.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const today = new Date().toISOString().split('T')[0];

  // Réinitialiser le quota si nouveau jour calendaire
  if (user.last_reset !== today) {
    db.prepare(
      'UPDATE users SET messages_used = 0, last_reset = ? WHERE id = ?'
    ).run(today, userId);
    user.messages_used = 0;
  }

  if (user.messages_used >= user.daily_quota) {
    return res.status(429).json({
      error: "Tu as utilisé tous tes messages pour aujourd'hui. Reviens demain !",
      quota: user.daily_quota,
      used: user.messages_used,
    });
  }

  req.userRecord = user;
  next();
}
