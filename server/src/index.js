import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDB } from './db/init.js';
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';
import textsRouter from './routes/texts.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS : en dev tout passer, en prod n'accepter que le domaine Netlify
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_ORIGIN].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, cb) => {
    // Autoriser les requêtes sans origine (Postman, curl, health checks)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origine non autorisée par CORS : ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/texts', textsRouter);

// Santé du serveur (utile pour Railway/Render et les tests)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Racine : message d'info en dev (évite la confusion "Cannot GET /")
app.get('/', (req, res) => {
  const frontUrl = process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_ORIGIN ?? 'ton URL Netlify'
    : 'http://localhost:5173';
  res.send(`
    <style>body{font-family:sans-serif;max-width:480px;margin:80px auto;color:#2C2C3E}</style>
    <h2>Revision1G3 — API Backend</h2>
    <p>Ce port est réservé à l'API. Le site se trouve ici :</p>
    <p><a href="${frontUrl}">${frontUrl}</a></p>
    <hr><p style="color:#999;font-size:13px">Routes disponibles : /api/health · /api/auth/* · /api/texts · /api/chat/*</p>
  `);
});

// Initialiser la base de données puis démarrer
initDB();
app.listen(PORT, () => {
  console.log(`✓ Serveur Revision1G3 démarré sur http://localhost:${PORT}`);
  console.log(`  Mode : ${process.env.NODE_ENV || 'development'}`);
});
