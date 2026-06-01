import db from './database.js';

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      daily_quota   INTEGER DEFAULT 30,
      messages_used INTEGER DEFAULT 0,
      last_reset    DATE DEFAULT (date('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS messages_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      text_id    TEXT NOT NULL,
      role       TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content    TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_user ON messages_log(user_id, created_at);
  `);
  console.log('✓ Base de données initialisée');
}
