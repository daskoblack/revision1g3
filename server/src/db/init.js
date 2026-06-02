import db from './database.js';

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      username              TEXT UNIQUE NOT NULL,
      password_hash         TEXT NOT NULL,
      classe                TEXT NOT NULL DEFAULT '',
      created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
      daily_quota           INTEGER DEFAULT 30,
      messages_used         INTEGER DEFAULT 0,
      last_reset            DATE DEFAULT (date('now')),
      texts_created_today   INTEGER DEFAULT 0,
      texts_last_reset      DATE DEFAULT (date('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

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
    CREATE INDEX IF NOT EXISTS idx_messages_text ON messages_log(user_id, text_id, created_at);

    CREATE TABLE IF NOT EXISTS user_texts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      slug         TEXT UNIQUE NOT NULL,
      title        TEXT NOT NULL,
      oeuvre       TEXT NOT NULL,
      auteur       TEXT NOT NULL,
      annee        TEXT DEFAULT '',
      mouvement    TEXT DEFAULT '',
      classe       TEXT NOT NULL,
      content_json TEXT NOT NULL,
      is_public    INTEGER DEFAULT 0,
      share_token  TEXT UNIQUE,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_user_texts_user    ON user_texts(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_user_texts_classe  ON user_texts(classe, created_at);
    CREATE INDEX IF NOT EXISTS idx_user_texts_public  ON user_texts(is_public, created_at);
    CREATE INDEX IF NOT EXISTS idx_user_texts_share   ON user_texts(share_token);

    CREATE TABLE IF NOT EXISTS text_shares (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      text_id      INTEGER NOT NULL,
      from_user_id INTEGER NOT NULL,
      to_user_id   INTEGER NOT NULL,
      seen         INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (text_id)      REFERENCES user_texts(id) ON DELETE CASCADE,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id)   REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_shares_to_user ON text_shares(to_user_id, seen, created_at);
  `);

  // Migrations safe pour les bases existantes (colonnes ajoutées après coup)
  const migrateColumn = (table, column, definition) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`  ✓ Migration : ${table}.${column} ajouté`);
    } catch {
      // Colonne déjà existante → silencieux
    }
  };

  migrateColumn('users', 'classe',              "TEXT NOT NULL DEFAULT ''");
  migrateColumn('users', 'texts_created_today', 'INTEGER DEFAULT 0');
  migrateColumn('users', 'texts_last_reset',    "DATE DEFAULT (date('now'))");

  console.log('✓ Base de données initialisée');
}
