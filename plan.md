# plan.md — Projet "M. Marin" : Site de Révision Bac de Français

> **Document auto-suffisant.** À partir de ce seul fichier, n'importe quelle IA doit pouvoir construire le projet intégralement sans poser de questions.

---

## 0. État des lieux au démarrage (2026-06-01)

| Élément                          | Statut                                        | Notes                                        |
| -------------------------------- | --------------------------------------------- | -------------------------------------------- |
| `siteFR/`                        | Existe — scaffold Vite+React vierge           | À renommer en `client/`                      |
| `text_1.txt` … `text_13.txt`     | Existent — **contenu placeholder uniquement** | Attendre les vrais fichiers de l'utilisateur |
| `server/`                        | Absent                                        | À créer de zéro                              |
| Tailwind, React Router, groq-sdk | Absents                                       | À installer                                  |
| Base de données SQLite           | Absente                                       | À créer avec `better-sqlite3`                |

**Règle absolue sur les textes :** Les fichiers `text_N.txt` actuels ne contiennent que `"Contenu du fichier text_N"` (générés par `main.py`). Ne jamais inventer de contenu littéraire. Le fichier `client/src/data/texts.js` démarre avec un tableau vide. Chaque vrai `text_N.txt` fourni par l'utilisateur sera converti et ajouté.

---

## 1. Vue d'ensemble du projet

"M. Marin" est un site web pédagogique destiné à une classe de lycée pour préparer le Bac de Français. Il propose une bibliothèque de fiches d'analyses linéaires complètes, un assistant IA conversationnel par texte (propulsé par Groq), et un système de comptes utilisateurs avec quota de messages quotidien. Le stack est React + Vite (frontend) / Node.js + Express + SQLite (backend), hébergé sur Netlify + Railway. L'IA utilise plusieurs clés Groq en rotation pour éviter le rate-limiting. Chaque assistant est spécialisé sur un texte précis via un system prompt dédié. Le design imite un "cahier littéraire" : sobre, typographié, responsive mobile.

---

## 2. Arborescence complète cible

```
C:\serveurs\htdocs\SiteFR\          ← racine du monorepo (dossier de travail actuel)
│
├── client/                         ← renommé depuis siteFR/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── TextCard.jsx
│   │   │   ├── ChatWidget.jsx
│   │   │   ├── QuotaBar.jsx
│   │   │   └── AuthForm.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── TextList.jsx
│   │   │   ├── TextDetail.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── data/
│   │   │   └── texts.js            ← tableau vide au départ
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── chat.js
│   │   │   └── texts.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── quotaMiddleware.js
│   │   ├── db/
│   │   │   ├── init.js
│   │   │   └── database.js
│   │   ├── services/
│   │   │   └── groqService.js
│   │   └── index.js
│   ├── data/
│   │   └── marin.db                ← créé automatiquement au 1er démarrage
│   ├── .env                        ← jamais commité
│   ├── .env.example
│   └── package.json
│
├── texts-source/                   ← copier les text_N.txt ici pour organisation
│   ├── text_1.txt … text_13.txt
│
├── .gitignore
├── netlify.toml
├── README.md
└── plan.md                         ← ce fichier
```

---

## 3. Étapes de développement

### Étape 1 — Restructuration du monorepo ⏱ ~10 min

**Objectif :** transformer le dossier de travail en monorepo propre avec `client/` et `server/`.

**Actions :**

1. Renommer `siteFR/` → `client/`

   ```powershell
   Rename-Item "C:\serveurs\htdocs\SiteFR\siteFR" "client"
   ```

2. Déplacer les fichiers texte dans `texts-source/` (pour garder la racine propre)

   ```powershell
   New-Item -ItemType Directory "C:\serveurs\htdocs\SiteFR\texts-source"
   Move-Item "C:\serveurs\htdocs\SiteFR\text_*.txt" "C:\serveurs\htdocs\SiteFR\texts-source\"
   ```

3. Supprimer `main.py` (script de génération des placeholders, inutile désormais)

   ```powershell
   Remove-Item "C:\serveurs\htdocs\SiteFR\main.py"
   ```

4. Créer le dossier `server/`

   ```powershell
   New-Item -ItemType Directory "C:\serveurs\htdocs\SiteFR\server"
   New-Item -ItemType Directory "C:\serveurs\htdocs\SiteFR\server\src"
   New-Item -ItemType Directory "C:\serveurs\htdocs\SiteFR\server\src\routes"
   New-Item -ItemType Directory "C:\serveurs\htdocs\SiteFR\server\src\middleware"
   New-Item -ItemType Directory "C:\serveurs\htdocs\SiteFR\server\src\db"
   New-Item -ItemType Directory "C:\serveurs\htdocs\SiteFR\server\src\services"
   New-Item -ItemType Directory "C:\serveurs\htdocs\SiteFR\server\data"
   ```

5. Créer le `.gitignore` racine (contenu dans §4).

---

### Étape 2 — Setup du backend (Express + SQLite + Auth) ⏱ ~25 min

**Objectif :** serveur Node.js fonctionnel avec base de données et authentification JWT.

**2.1 — Initialiser le package.json du server**

```bash
cd server
npm init -y
npm install express better-sqlite3 bcrypt jsonwebtoken dotenv cors groq-sdk
npm install --save-dev nodemon
```

**2.2 — Créer `server/package.json`** (contenu exact dans §4)

**2.3 — Créer `server/.env.example`** (contenu dans §4)

**2.4 — Créer `server/.env`** (à remplir avec les vraies clés — jamais commité)

**2.5 — Créer `server/src/db/database.js`**

```js
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../data/marin.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export default db;
```

**2.6 — Créer `server/src/db/init.js`**

```js
import db from "./database.js";

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      daily_quota INTEGER DEFAULT 30,
      messages_used INTEGER DEFAULT 0,
      last_reset DATE DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS messages_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      text_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  console.log("✓ Base de données initialisée");
}
```

**2.7 — Créer `server/src/services/groqService.js`**

```js
import Groq from "groq-sdk";

// Rotation des clés Groq pour éviter le rate-limiting
const keys = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
].filter(Boolean);

if (keys.length === 0)
  throw new Error("Aucune clé GROQ_KEY_* trouvée dans .env");

let currentKeyIndex = 0;

function getNextClient() {
  const client = new Groq({ apiKey: keys[currentKeyIndex] });
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return client;
}

export async function chatWithGroq(systemPrompt, messages, retries = 0) {
  if (retries >= keys.length) {
    throw new Error(
      "Toutes les clés Groq sont saturées. Réessaie dans quelques instants.",
    );
  }
  const client = getNextClient();
  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    });
    return completion.choices[0].message.content;
  } catch (err) {
    if (err.status === 429) {
      // Clé rate-limitée → passer à la suivante
      console.warn(`Clé Groq #${currentKeyIndex} saturée, rotation...`);
      return chatWithGroq(systemPrompt, messages, retries + 1);
    }
    throw err;
  }
}
```

**2.8 — Créer `server/src/middleware/authMiddleware.js`**

```js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
```

**2.9 — Créer `server/src/middleware/quotaMiddleware.js`**

```js
import db from "../db/database.js";

export function checkQuota(req, res, next) {
  const userId = req.user.id;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  const today = new Date().toISOString().split("T")[0];

  // Réinitialiser le quota si nouveau jour
  if (user.last_reset !== today) {
    db.prepare(
      "UPDATE users SET messages_used = 0, last_reset = ? WHERE id = ?",
    ).run(today, userId);
    user.messages_used = 0;
  }

  if (user.messages_used >= user.daily_quota) {
    return res.status(429).json({
      error:
        "Tu as utilisé tous tes messages pour aujourd'hui. Reviens demain !",
      quota: user.daily_quota,
      used: user.messages_used,
    });
  }

  req.userRecord = user;
  next();
}
```

**2.10 — Créer `server/src/routes/auth.js`**

```js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db/database.js";

const router = Router();
const SALT_ROUNDS = 12;

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email et mot de passe requis" });
  if (password.length < 8)
    return res
      .status(400)
      .json({ error: "Mot de passe trop court (min 8 caractères)" });

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = db
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(email.toLowerCase().trim(), hash);

    const token = jwt.sign(
      { id: result.lastInsertRowid, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(201).json({ token, email });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email et mot de passe requis" });

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: "Identifiants incorrects" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Identifiants incorrects" });

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
  res.json({ token, email: user.email });
});

export default router;
```

**2.11 — Créer `server/src/routes/chat.js`**

```js
import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { checkQuota } from "../middleware/quotaMiddleware.js";
import { chatWithGroq } from "../services/groqService.js";
import db from "../db/database.js";

// Import des textes depuis le client (chemin relatif monorepo)
// Note : en production, les textes sont dupliqués dans server/data/texts.js
// ou importés via un chemin absolu selon la config.
// Solution simple : copier texts.js dans server/data/ lors du build.
// Pour l'instant, on importe depuis un fichier local au server.
import { texts } from "../data/texts.js";

const router = Router();

// GET /api/user/quota
router.get("/quota", requireAuth, (req, res) => {
  const user = db
    .prepare(
      "SELECT daily_quota, messages_used, last_reset FROM users WHERE id = ?",
    )
    .get(req.user.id);
  const today = new Date().toISOString().split("T")[0];
  const used = user.last_reset !== today ? 0 : user.messages_used;
  res.json({
    quota: user.daily_quota,
    used,
    remaining: user.daily_quota - used,
  });
});

// POST /api/chat/:textId
router.post("/:textId", requireAuth, checkQuota, async (req, res) => {
  const { textId } = req.params;
  const { messages } = req.body; // tableau [{role, content}]

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages manquants" });
  }

  const text = texts.find((t) => t.id === textId);
  if (!text) return res.status(404).json({ error: "Texte introuvable" });

  try {
    const reply = await chatWithGroq(text.systemPrompt, messages);

    // Incrémenter le compteur de messages
    db.prepare(
      "UPDATE users SET messages_used = messages_used + 1 WHERE id = ?",
    ).run(req.user.id);

    // Logger le message
    db.prepare(
      "INSERT INTO messages_log (user_id, text_id, role, content) VALUES (?, ?, ?, ?)",
    ).run(req.user.id, textId, "assistant", reply);

    const updatedUser = db
      .prepare("SELECT messages_used, daily_quota FROM users WHERE id = ?")
      .get(req.user.id);
    res.json({
      reply,
      quotaRemaining: updatedUser.daily_quota - updatedUser.messages_used,
    });
  } catch (err) {
    if (err.message.includes("saturées")) {
      return res.status(503).json({ error: err.message });
    }
    console.error(err);
    res
      .status(500)
      .json({ error: "Erreur lors de la communication avec l'IA" });
  }
});

export default router;
```

**2.12 — Créer `server/src/routes/texts.js`**

```js
import { Router } from "express";
import { texts } from "../data/texts.js";

const router = Router();

// GET /api/texts
router.get("/", (req, res) => {
  // Retourner seulement les métadonnées (pas le systemPrompt ni l'analyse complète)
  const summary = texts.map(
    ({ id, title, oeuvre, auteur, annee, mouvement }) => ({
      id,
      title,
      oeuvre,
      auteur,
      annee,
      mouvement,
    }),
  );
  res.json(summary);
});

// GET /api/texts/:id
router.get("/:id", (req, res) => {
  const text = texts.find((t) => t.id === req.params.id);
  if (!text) return res.status(404).json({ error: "Texte introuvable" });
  // Ne pas exposer le systemPrompt côté client
  const { systemPrompt, ...safeText } = text;
  res.json(safeText);
});

export default router;
```

**2.13 — Créer `server/src/index.js`**

```js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDB } from "./db/init.js";
import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import textsRouter from "./routes/texts.js";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS : en prod, n'accepter que le domaine Netlify
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.CLIENT_ORIGIN]
    : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error("Origine non autorisée par CORS"));
    },
  }),
);

app.use(express.json({ limit: "10kb" }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/texts", textsRouter);

// Santé du serveur
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() }),
);

// Initialiser la BDD puis démarrer
initDB();
app.listen(PORT, () =>
  console.log(`✓ Serveur M. Marin sur http://localhost:${PORT}`),
);
```

**2.14 — Créer `server/src/data/texts.js`** (miroir du fichier client — voir §4 pour la synchronisation)

```js
// Synchronisé manuellement avec client/src/data/texts.js
// Les systemPrompts ne sont présents que dans ce fichier serveur
export const texts = [];
// Les textes seront ajoutés ici au fur et à mesure des fichiers text_[n].txt fournis
```

---

### Étape 3 — Setup du frontend (Vite + React + Router + Tailwind) ⏱ ~15 min

**Objectif :** enrichir le scaffold `client/` avec les dépendances nécessaires.

**3.1 — Installer les dépendances**

```bash
cd client
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**3.2 — Mettre à jour `client/package.json`** (contenu dans §4)

**3.3 — Configurer `client/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        parchment: "#f5f0e8",
        ink: "#1a1a2e",
        "ink-light": "#4a4a6a",
        accent: "#8b4513",
        "accent-light": "#d4956a",
      },
    },
  },
  plugins: [],
};
```

**3.4 — Mettre à jour `client/src/index.css`**

```css
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap");
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-parchment text-ink font-sans;
  }
  h1,
  h2,
  h3,
  h4 {
    @apply font-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-accent text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition font-medium;
  }
  .btn-secondary {
    @apply border border-accent text-accent px-4 py-2 rounded-md hover:bg-accent hover:text-white transition;
  }
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-100 p-6;
  }
  .input-field {
    @apply w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent;
  }
}
```

**3.5 — Mettre à jour `client/vite.config.js`**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

---

### Étape 4 — Fichier de données textes ⏱ ~5 min (initialisation) + variable selon les textes fournis

**Objectif :** créer `client/src/data/texts.js` vide, prêt à recevoir les fiches.

```js
// client/src/data/texts.js
// Les textes seront ajoutés ici au fur et à mesure des fichiers text_[n].txt fournis par l'utilisateur.
// NE PAS inventer de contenu littéraire.

export const texts = [];
```

**Format d'une fiche texte (à respecter strictement) :**

```js
{
  id: "marivaux-jeu-acte1-scene1",          // slug kebab-case unique
  title: "Acte I, Scène 1",
  oeuvre: "Le Jeu de l'amour et du hasard",
  auteur: "Marivaux",
  annee: 1730,
  mouvement: "Comédie des Lumières",
  contexteAuteur: "Texte biographique...",
  contexteOeuvre: "Contexte de l'œuvre...",
  resume: "Résumé du passage étudié...",
  introduction: "Introduction rédigée complète (accroche + présentation + annonce du plan)...",
  conclusion: "Conclusion rédigée (bilan + ouverture)...",
  analyseLineaire: [
    { passage: "Lignes 1-5", analyse: "Analyse détaillée du passage..." },
    { passage: "Lignes 6-12", analyse: "..." },
  ],
  procedesStyliques: [
    { procede: "Antithèse", exemple: "Citation exacte du texte", effet: "Effet produit sur le lecteur..." },
  ],
  problematiquesPossibles: [
    "En quoi ce texte illustre-t-il... ?",
    "Comment Marivaux montre-t-il... ?",
  ],
  axesLecture: [
    "Axe 1 : ...",
    "Axe 2 : ...",
    "Axe 3 : ...",
  ],
  mnemo: [
    "Pour retenir : ...",
    "Astuce : ...",
  ],
  // systemPrompt est UNIQUEMENT dans server/src/data/texts.js (jamais exposé au client)
}
```

**Procédure d'ajout d'un nouveau texte :**

1. L'utilisateur fournit `text_N.txt` avec le contenu réel
2. Lire le fichier, extraire toutes les informations
3. Créer l'objet JS selon le format ci-dessus
4. L'ajouter au tableau dans `client/src/data/texts.js`
5. Créer une version avec `systemPrompt` dans `server/src/data/texts.js`

**Format du systemPrompt (à personnaliser par texte) :**

```js
systemPrompt: `Tu es M. Marin, un professeur de français bienveillant et expert du texte "${title}" de ${auteur} (extrait de "${oeuvre}", ${annee}).

Tu aides un élève de lycée à préparer son bac de français. Tes règles :
- Tu réponds UNIQUEMENT aux questions liées à ce texte et au bac de français
- Tu es pédagogique, précis, encourageant, adapté au niveau lycée (Terminale)
- Tu peux : expliquer un passage, identifier un procédé stylistique, formuler une réponse d'oral, simuler des questions d'examinateur
- Tu ne fais PAS les devoirs à la place de l'élève : tu guides, tu questionnes, tu suggères
- Si une question est hors sujet, redirige gentiment vers le texte étudié

TEXTE ÉTUDIÉ — ${title} (${auteur}) :
${resume}

AXES DE LECTURE PRINCIPAUX :
${axesLecture.join('\n')}

PROCÉDÉS CLÉS :
${procedesStyliques.map(p => `- ${p.procede} : "${p.exemple}" → ${p.effet}`).join('\n')}

PROBLÉMATIQUES POSSIBLES :
${problematiquesPossibles.join('\n')}`,
```

---

### Étape 5 — Pages frontend ⏱ ~45 min

#### 5.1 — `client/src/context/AuthContext.jsx`

```jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [quota, setQuota] = useState({ quota: 30, used: 0, remaining: 30 });

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchQuota();
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const fetchQuota = async () => {
    try {
      const res = await axios.get("/api/chat/quota");
      setQuota(res.data);
    } catch {}
  };

  const login = (newToken, email) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser({ email });
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{ user, token, quota, login, logout, fetchQuota }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### 5.2 — `client/src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import TextList from "./pages/TextList";
import TextDetail from "./pages/TextDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/textes"
            element={
              <PrivateRoute>
                <TextList />
              </PrivateRoute>
            }
          />
          <Route
            path="/textes/:id"
            element={
              <PrivateRoute>
                <TextDetail />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
```

#### 5.3 — `client/src/components/Navbar.jsx`

```jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QuotaBar from "./QuotaBar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-ink text-white shadow-md">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif text-xl font-bold tracking-wide text-accent-light"
        >
          M. Marin
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link to="/textes" className="hover:text-accent-light transition">
                Textes
              </Link>
              <QuotaBar />
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-accent-light transition">
                Connexion
              </Link>
              <Link to="/register" className="btn-primary text-sm px-3 py-1">
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
```

#### 5.4 — `client/src/components/QuotaBar.jsx`

```jsx
import { useAuth } from "../context/AuthContext";

export default function QuotaBar() {
  const { quota } = useAuth();
  const percent = Math.round((quota.remaining / quota.quota) * 100);
  const color =
    percent > 50
      ? "bg-green-500"
      : percent > 20
        ? "bg-yellow-400"
        : "bg-red-500";

  return (
    <div
      className="flex items-center gap-2 text-xs text-gray-300"
      title={`${quota.remaining} messages restants aujourd'hui`}
    >
      <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span>
        {quota.remaining}/{quota.quota}
      </span>
    </div>
  );
}
```

#### 5.5 — `client/src/components/TextCard.jsx`

```jsx
import { Link } from "react-router-dom";

export default function TextCard({ text }) {
  return (
    <Link
      to={`/textes/${text.id}`}
      className="block card hover:shadow-md transition group"
    >
      <div className="text-xs text-accent font-medium uppercase tracking-widest mb-1">
        {text.mouvement}
      </div>
      <h2 className="font-serif text-lg font-semibold text-ink group-hover:text-accent transition">
        {text.oeuvre}
      </h2>
      <p className="text-ink-light text-sm mt-1">
        {text.title} — <span className="italic">{text.auteur}</span>
      </p>
      <p className="text-gray-400 text-xs mt-2">{text.annee}</p>
    </Link>
  );
}
```

#### 5.6 — `client/src/pages/Home.jsx`

```jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-accent font-serif italic text-lg mb-4">
        « La littérature, c'est la vie elle-même »
      </p>
      <h1 className="font-serif text-5xl font-bold text-ink mb-6 leading-tight">
        Prépare ton Bac
        <br />
        de Français
      </h1>
      <p className="text-ink-light text-lg mb-10 max-w-xl mx-auto">
        Analyses linéaires complètes, assistant IA personnalisé par texte,
        <br />
        et fiches mémo pour réussir l'oral du bac.
      </p>
      {user ? (
        <Link to="/textes" className="btn-primary text-base px-8 py-3">
          Accéder aux textes →
        </Link>
      ) : (
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Commencer
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">
            Connexion
          </Link>
        </div>
      )}
      <div className="mt-20 grid grid-cols-3 gap-6 text-left">
        {[
          {
            icon: "📖",
            title: "13 textes analysés",
            desc: "Chaque texte du programme avec analyse linéaire complète",
          },
          {
            icon: "🤖",
            title: "Assistant IA",
            desc: "M. Marin répond à tes questions sur chaque texte",
          },
          {
            icon: "🎯",
            title: "30 messages/jour",
            desc: "Pose tes questions, simule ton oral, entraîne-toi",
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card text-center">
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="font-serif font-semibold text-ink mb-2">{title}</h3>
            <p className="text-ink-light text-sm">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 5.7 — `client/src/pages/TextList.jsx`

```jsx
import { useState } from "react";
import { texts } from "../data/texts";
import TextCard from "../components/TextCard";

export default function TextList() {
  const [search, setSearch] = useState("");
  const filtered = texts.filter((t) =>
    [t.title, t.oeuvre, t.auteur, t.mouvement].some((f) =>
      f.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl font-bold text-ink mb-2">
        Textes du programme
      </h1>
      <p className="text-ink-light mb-6">
        Clique sur un texte pour accéder à la fiche complète et à l'assistant
        IA.
      </p>
      <input
        className="input-field max-w-sm mb-8"
        placeholder="Rechercher par titre, auteur, mouvement..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p className="text-ink-light">Aucun texte trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TextCard key={t.id} text={t} />
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 5.8 — `client/src/pages/TextDetail.jsx`

```jsx
import { useParams } from "react-router-dom";
import { texts } from "../data/texts";
import ChatWidget from "../components/ChatWidget";

export default function TextDetail() {
  const { id } = useParams();
  const text = texts.find((t) => t.id === id);

  if (!text)
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-ink-light">
        Texte introuvable.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* En-tête */}
      <div className="mb-8">
        <span className="text-xs text-accent font-medium uppercase tracking-widest">
          {text.mouvement} · {text.annee}
        </span>
        <h1 className="font-serif text-4xl font-bold text-ink mt-1">
          {text.oeuvre}
        </h1>
        <p className="text-ink-light mt-1 text-lg italic">
          {text.title} — {text.auteur}
        </p>
      </div>

      {/* Contexte */}
      <section className="card mb-6">
        <h2 className="font-serif text-xl font-semibold mb-3">Contexte</h2>
        <p className="text-ink-light leading-relaxed">{text.contexteAuteur}</p>
        <p className="text-ink-light leading-relaxed mt-2">
          {text.contexteOeuvre}
        </p>
      </section>

      {/* Résumé */}
      <section className="card mb-6">
        <h2 className="font-serif text-xl font-semibold mb-3">
          Résumé du passage
        </h2>
        <p className="text-ink-light leading-relaxed">{text.resume}</p>
      </section>

      {/* Introduction */}
      <section className="card mb-6 border-l-4 border-accent">
        <h2 className="font-serif text-xl font-semibold mb-3">
          Introduction rédigée
        </h2>
        <p className="text-ink-light leading-relaxed whitespace-pre-line">
          {text.introduction}
        </p>
      </section>

      {/* Analyse linéaire */}
      <section className="card mb-6">
        <h2 className="font-serif text-xl font-semibold mb-4">
          Analyse linéaire
        </h2>
        <div className="space-y-4">
          {text.analyseLineaire.map((a, i) => (
            <div
              key={i}
              className="border-b border-gray-100 pb-4 last:border-0"
            >
              <span className="text-accent font-semibold text-sm">
                {a.passage}
              </span>
              <p className="text-ink-light mt-1 leading-relaxed">{a.analyse}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Procédés stylistiques */}
      <section className="card mb-6">
        <h2 className="font-serif text-xl font-semibold mb-4">
          Procédés stylistiques
        </h2>
        <div className="space-y-3">
          {text.procedesStyliques.map((p, i) => (
            <div key={i} className="bg-parchment rounded p-3">
              <span className="font-semibold text-ink">{p.procede}</span>
              <span className="mx-2 text-gray-400">·</span>
              <span className="italic text-ink-light text-sm">
                "{p.exemple}"
              </span>
              <p className="text-ink-light text-sm mt-1">→ {p.effet}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problématiques */}
      <section className="card mb-6">
        <h2 className="font-serif text-xl font-semibold mb-3">
          Problématiques possibles
        </h2>
        <ul className="space-y-2">
          {text.problematiquesPossibles.map((p, i) => (
            <li key={i} className="flex gap-2 text-ink-light">
              <span className="text-accent">→</span>
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* Axes de lecture */}
      <section className="card mb-6">
        <h2 className="font-serif text-xl font-semibold mb-3">
          Axes de lecture
        </h2>
        <ol className="space-y-2">
          {text.axesLecture.map((a, i) => (
            <li key={i} className="text-ink-light">
              <span className="font-semibold text-ink mr-2">{i + 1}.</span>
              {a}
            </li>
          ))}
        </ol>
      </section>

      {/* Conclusion */}
      <section className="card mb-6 border-l-4 border-accent">
        <h2 className="font-serif text-xl font-semibold mb-3">
          Conclusion rédigée
        </h2>
        <p className="text-ink-light leading-relaxed whitespace-pre-line">
          {text.conclusion}
        </p>
      </section>

      {/* Mémo */}
      <section className="card mb-10 bg-yellow-50 border-yellow-200">
        <h2 className="font-serif text-xl font-semibold mb-3">Mémo rapide</h2>
        <ul className="space-y-2">
          {text.mnemo.map((m, i) => (
            <li key={i} className="flex gap-2 text-ink-light">
              <span>💡</span>
              {m}
            </li>
          ))}
        </ul>
      </section>

      {/* Chat IA */}
      <ChatWidget
        textId={text.id}
        textTitle={`${text.title} — ${text.auteur}`}
      />
    </div>
  );
}
```

#### 5.9 — `client/src/components/ChatWidget.jsx`

```jsx
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function ChatWidget({ textId, textTitle }) {
  const { quota, fetchQuota } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Bonjour ! Je suis M. Marin, ton assistant pour le texte "${textTitle}". Pose-moi tes questions sur l'analyse, les procédés stylistiques, ou simule ton oral !`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setError("");

    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Envoyer uniquement les N derniers messages pour limiter la taille
      const context = newMessages.slice(-10);
      const res = await axios.post(`/api/chat/${textId}`, {
        messages: context,
      });
      setMessages([
        ...newMessages,
        { role: "assistant", content: res.data.reply },
      ]);
      await fetchQuota();
    } catch (err) {
      const msg = err.response?.data?.error || "Erreur de connexion. Réessaie.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="card border-2 border-accent-light" id="chat">
      <h2 className="font-serif text-xl font-semibold mb-1">
        M. Marin — Assistant IA
      </h2>
      <p className="text-sm text-ink-light mb-4">
        Expert sur ce texte · {quota.remaining} messages restants aujourd'hui
      </p>

      {/* Messages */}
      <div className="h-80 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-accent text-white"
                  : "bg-gray-100 text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-ink-light animate-pulse">
              M. Marin réfléchit…
            </div>
          </div>
        )}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          className="input-field flex-1 resize-none"
          rows={2}
          placeholder="Pose ta question sur ce texte... (Entrée pour envoyer)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading || quota.remaining <= 0}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim() || quota.remaining <= 0}
          className="btn-primary self-end px-5 disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
```

#### 5.10 — `client/src/pages/Login.jsx`

```jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", form);
      login(res.data.token, res.data.email);
      navigate("/textes");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="font-serif text-3xl font-bold text-ink mb-2">Connexion</h1>
      <p className="text-ink-light mb-8">
        Accède à tes fiches et à l'assistant M. Marin.
      </p>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Email
          </label>
          <input
            type="email"
            className="input-field"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            className="input-field"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="text-center text-sm text-ink-light mt-4">
        Pas encore de compte ?{" "}
        <Link to="/register" className="text-accent hover:underline">
          S'inscrire
        </Link>
      </p>
    </div>
  );
}
```

#### 5.11 — `client/src/pages/Register.jsx`

```jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm)
      return setError("Les mots de passe ne correspondent pas");
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", {
        email: form.email,
        password: form.password,
      });
      login(res.data.token, res.data.email);
      navigate("/textes");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="font-serif text-3xl font-bold text-ink mb-2">
        Créer un compte
      </h1>
      <p className="text-ink-light mb-8">
        Rejoins la classe et accède à toutes les fiches.
      </p>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Email
          </label>
          <input
            type="email"
            className="input-field"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Mot de passe (8 caractères min.)
          </label>
          <input
            type="password"
            className="input-field"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            className="input-field"
            required
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Inscription…" : "Créer mon compte"}
        </button>
      </form>
      <p className="text-center text-sm text-ink-light mt-4">
        Déjà un compte ?{" "}
        <Link to="/login" className="text-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
```

---

### Étape 6 — Authentification JWT (backend) ⏱ déjà fait en Étape 2

Tout est dans `server/src/routes/auth.js`, `authMiddleware.js`, et `index.js`. Vérifier que les variables d'environnement sont définies.

---

### Étape 7 — ChatWidget + intégration Groq avec rotation de clés ⏱ déjà fait

Voir `server/src/services/groqService.js` (Étape 2.7) et `client/src/components/ChatWidget.jsx` (Étape 5.9). La rotation des clés est automatique : round-robin + fallback sur 429.

**Point de vigilance Groq :** Le modèle `llama-3.3-70b-versatile` est le meilleur disponible sur Groq en juin 2026. Si indisponible, fallback sur `llama-3.1-70b-versatile`. Vérifier la disponibilité sur [console.groq.com](https://console.groq.com).

---

### Étape 8 — Système de quota utilisateur ⏱ déjà fait

Voir `server/src/middleware/quotaMiddleware.js` (Étape 2.9). Le reset se fait par comparaison de la date (`last_reset`) à chaque requête, pas via un cron. Pas besoin de scheduler.

---

### Étape 9 — Design et responsive ⏱ ~20 min

Le design "cahier littéraire" est intégré dans les composants via Tailwind. Points à vérifier :

- Import des Google Fonts dans `index.css` (Playfair Display + Inter)
- Classes responsives sur `TextList.jsx` (grid 1→2→3 colonnes)
- `ChatWidget.jsx` : hauteur fixe avec scroll interne sur mobile
- `TextDetail.jsx` : padding adapté mobile (`px-4`)
- Navbar : sur mobile, masquer le label texte et garder les liens essentiels

**Ajout recommandé — breakpoint mobile Navbar :**

```jsx
// Dans Navbar.jsx, ajouter hidden md:flex sur les liens secondaires
<div className="hidden md:flex items-center gap-4">...</div>
```

---

### Étape 10 — Configuration Netlify + Railway/Render ⏱ ~20 min

#### Netlify (Frontend)

Créer `netlify.toml` à la racine du repo :

```toml
[build]
  base = "client"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Variable d'environnement Netlify à configurer :

```
VITE_API_URL=https://[ton-backend].railway.app
```

Puis mettre à jour `client/vite.config.js` pour utiliser cette variable en prod :

```js
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://localhost:3001',
      changeOrigin: true,
    }
  }
}
```

**Alternative plus robuste** — configurer `axios` dans le frontend pour pointer vers l'URL backend :

```js
// client/src/main.jsx — ajouter avant le render :
import axios from "axios";
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";
```

#### Railway (Backend)

1. Créer un compte Railway → New Project → Deploy from GitHub
2. Sélectionner le dossier `server/` comme root
3. Ajouter les variables d'environnement :
   ```
   GROQ_KEY_1=gsk_xxxxxxxxxxxx
   GROQ_KEY_2=gsk_xxxxxxxxxxxx
   GROQ_KEY_3=gsk_xxxxxxxxxxxx
   JWT_SECRET=une_chaine_aleatoire_longue_et_securisee
   CLIENT_ORIGIN=https://[ton-site].netlify.app
   NODE_ENV=production
   PORT=3001
   ```
4. Start command : `node src/index.js`
5. Railway crée automatiquement un domaine public

**Alternative Render :**

- New Web Service → GitHub → root dir = `server`
- Build command : `npm install`
- Start command : `node src/index.js`
- Variables d'env identiques

---

### Étape 11 — Tests et mise en ligne ⏱ ~20 min

**Tests locaux (avant déploiement) :**

1. Démarrer le backend :

   ```bash
   cd server && node src/index.js
   # → ✓ Base de données initialisée
   # → ✓ Serveur M. Marin sur http://localhost:3001
   ```

2. Démarrer le frontend :

   ```bash
   cd client && npm run dev
   # → http://localhost:5173
   ```

3. Checklist de test manuel :
   - [ ] Page d'accueil s'affiche correctement
   - [ ] Inscription avec un email valide → redirection vers `/textes`
   - [ ] Connexion avec les mêmes identifiants
   - [ ] Page `/textes` liste les textes disponibles (vide si `texts.js` vide)
   - [ ] Accès `/textes/:id` avec un ID valide
   - [ ] Envoi d'un message dans ChatWidget → réponse IA reçue
   - [ ] Quota décrémenté après chaque message
   - [ ] Tentative de connexion sans token → redirection `/login`
   - [ ] Test de la route `/api/health`

---

## 4. Contenu exact des fichiers de configuration

### `.gitignore` (racine)

```gitignore
# Dépendances
node_modules/

# Environnement
.env
*.env

# Base de données
*.db
*.db-shm
*.db-wal

# Build
dist/
build/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
```

### `server/package.json`

```json
{
  "name": "marin-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "groq-sdk": "^0.5.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

### `server/.env.example`

```bash
# Clés API Groq (obtenir sur console.groq.com)
GROQ_KEY_1=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_KEY_2=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_KEY_3=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT (générer avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=changer_cette_valeur_par_une_chaine_aleatoire_longue

# Serveur
PORT=3001
NODE_ENV=development

# CORS en production (URL Netlify)
CLIENT_ORIGIN=https://ton-site.netlify.app
```

### `client/package.json` (mis à jour)

```json
{
  "name": "marin-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "axios": "^1.7.2",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^8.0.12"
  }
}
```

### `client/postcss.config.js`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### `client/index.html` (mis à jour)

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="M. Marin — Site de révision du Bac de Français"
    />
    <title>M. Marin — Bac de Français</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `client/src/main.jsx` (mis à jour)

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";

// Configuration de l'URL de l'API
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

---

## 5. Schéma de base de données SQLite

```sql
-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  daily_quota     INTEGER DEFAULT 30,      -- messages autorisés par jour
  messages_used   INTEGER DEFAULT 0,       -- compteur du jour en cours
  last_reset      DATE DEFAULT (date('now')) -- date du dernier reset
);

-- Index pour la recherche par email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Table des logs de messages (optionnel — pour statistiques futures)
CREATE TABLE IF NOT EXISTS messages_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  text_id     TEXT NOT NULL,               -- ID du texte (ex: "marivaux-jeu-acte1")
  role        TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages_log(user_id, created_at);
```

**Logique de reset du quota :**

- Pas de cron, pas de trigger SQL
- À chaque requête `/api/chat/:id`, le middleware compare `users.last_reset` à `date('now')`
- Si différent → `UPDATE users SET messages_used = 0, last_reset = date('now')`
- Simple, sans état partagé, robuste

---

## 6. System prompts IA — template par texte

Le `systemPrompt` doit être rempli pour chaque texte dans `server/src/data/texts.js`. Voici le template à personnaliser :

```
Tu es M. Marin, un professeur de français bienveillant, pédagogique et exigeant. Tu es spécialiste du texte "[TITRE_EXACT]" de [AUTEUR], extrait de "[OEUVRE]" ([ANNEE]).

CONTEXTE DE LA DEMANDE :
Tu aides un élève de Terminale à préparer son bac de français (épreuve orale). L'élève connaît le texte mais a besoin d'aide pour approfondir son analyse.

TES CAPACITÉS :
- Expliquer un passage obscur mot par mot
- Identifier et nommer les procédés stylistiques avec leur effet
- Aider à formuler une réponse claire à une question d'examinateur
- Simuler un oral du bac (poser des questions comme un examinateur)
- Rappeler les axes de lecture et la problématique
- Proposer des comparaisons avec d'autres textes du programme si pertinent
- Aider à mémoriser les éléments clés

TES RÈGLES :
- Réponds UNIQUEMENT aux questions liées à ce texte et au bac de français en général
- Ne fais PAS le travail à la place de l'élève : guide, questionne, suggère, valide
- Si une question est hors sujet, redirige gentiment : "Pour ce texte, on peut plutôt se concentrer sur..."
- Utilise un langage adapté au niveau lycée (clair, précis, sans jargon inutile)
- Sois encourageant : valorise les bonnes intuitions de l'élève

FICHE DU TEXTE ÉTUDIÉ :

Titre : [TITRE_EXACT]
Auteur : [AUTEUR] ([CONTEXTE_BIOGRAPHIQUE_COURT])
Œuvre : [OEUVRE] ([ANNEE])
Mouvement : [MOUVEMENT_LITTERAIRE]

Résumé du passage : [RESUME_COMPLET]

Problématiques possibles :
[LISTE_PROBLEMATIQUES]

Axes de lecture :
[LISTE_AXES]

Procédés stylistiques principaux :
[LISTE_PROCEDES_AVEC_EXEMPLES]

Introduction rédigée (connais-la parfaitement) :
[INTRODUCTION_COMPLETE]

Conclusion rédigée :
[CONCLUSION_COMPLETE]
```

---

## 7. Checklist finale avant mise en production

### Code

- [ ] `client/src/data/texts.js` contient au moins 1 texte réel (pas de placeholders)
- [ ] `server/src/data/texts.js` contient les mêmes textes avec `systemPrompt` rempli
- [ ] Aucune clé API dans le code source (tout dans `.env`)
- [ ] `.env` dans `.gitignore` — vérifier avec `git status`
- [ ] CORS configuré avec le vrai domaine Netlify dans `.env` (`CLIENT_ORIGIN`)

### Backend

- [ ] `npm install` tourne sans erreur dans `server/`
- [ ] `node src/index.js` démarre sans erreur (DB init OK)
- [ ] Route `/api/health` retourne `{"status":"ok"}`
- [ ] Test d'inscription : `POST /api/auth/register` → token JWT reçu
- [ ] Test de connexion : `POST /api/auth/login` → token JWT reçu
- [ ] Test de chat : `POST /api/chat/:textId` avec token → réponse IA reçue
- [ ] Rate-limiting Groq : tester avec une fausse clé pour vérifier le fallback

### Frontend

- [ ] `npm run build` tourne sans erreur dans `client/`
- [ ] `VITE_API_URL` pointé vers le backend de production
- [ ] Toutes les pages s'affichent correctement (Home, Login, Register, TextList, TextDetail)
- [ ] Responsive mobile vérifié (Chrome DevTools → iPhone 12)
- [ ] ChatWidget fonctionnel : envoi → réponse → décrément quota visible

### Déploiement

- [ ] Repo GitHub à jour (`git push`) — sans `.env`, sans `*.db`, sans `node_modules`
- [ ] Backend déployé sur Railway/Render — variables d'env configurées
- [ ] Frontend déployé sur Netlify — `VITE_API_URL` configuré
- [ ] Tester l'URL Netlify finale en navigation privée (sans cache)
- [ ] Tester l'inscription depuis l'URL de production
- [ ] Tester un envoi de message IA depuis l'URL de production

---

## 8. Points de vigilance critiques

| Risque                                                      | Probabilité | Mitigation                                                                    |
| ----------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| Rate-limiting Groq                                          | Haute       | 3 clés en rotation + retry automatique sur 429                                |
| Quota CORS bloqué en prod                                   | Haute       | Vérifier `CLIENT_ORIGIN` correspond exactement à l'URL Netlify                |
| `better-sqlite3` non compilé sur Railway                    | Moyenne     | Railway supporte les bindings natifs ; si erreur, passer sur `@libsql/client` |
| JWT expiré silencieusement                                  | Faible      | Le client retire le token et redirige vers login sur 401                      |
| `VITE_API_URL` non défini → appels vers `/api` sans baseURL | Moyenne     | Le proxy Vite gère le dev, mais en prod l'URL doit être explicite             |
| Fichiers textes pas encore fournis                          | Certaine    | Le site fonctionne avec 0 texte — affiche juste une liste vide                |

---

## 9. Ordre d'exécution recommandé (pour finir avant minuit)

```
[18h00] Étape 1  — Restructuration monorepo               (10 min)
[18h10] Étape 2  — Backend complet (Express + SQLite)     (25 min)
[18h35] Étape 3  — Frontend setup (Tailwind + Router)     (15 min)
[18h50] Étapes 4-9 — Pages, composants, data              (60 min)
[19h50] Test local complet                                 (20 min)
[20h10] Étape 10 — Config Netlify + Railway                (20 min)
[20h30] Déploiement et tests en production                 (20 min)
[20h50] Ajout des vrais textes (text_N.txt) au fur et à mesure
[23h00] Site en ligne ✓
```

---

_Fin du plan.md — document auto-suffisant généré le 2026-06-01._
_Tout ce qui est nécessaire pour construire le projet est dans ce fichier._
_Les textes réels (text_N.txt) sont à fournir par l'utilisateur et seront convertis au format JS décrit en §4._
