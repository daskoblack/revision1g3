// Utilise le module SQLite natif de Node.js 22.5+ (pas de compilation native requise)
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production Railway : volume persistant monté sur /app/data
// Dev local : server/data/marin.db
const dataDir = process.env.NODE_ENV === 'production'
  ? '/app/data'
  : path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'marin.db'));
db.exec('PRAGMA journal_mode = WAL');

export default db;
