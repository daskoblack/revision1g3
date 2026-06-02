# Guide de déploiement — Revision1G3

> Ce guide permet de mettre le site en ligne **de A à Z**, en partant de zéro.
> Temps estimé : **45 minutes** la première fois.

---

## Architecture de déploiement

```
Élèves (navigateur)
        │
        ▼
┌───────────────────┐        ┌─────────────────────────┐
│     NETLIFY       │ ──API──▶│       RAILWAY           │
│  (Frontend React) │        │  (Backend Express)       │
│  revision1g3.     │        │  express + SQLite        │
│  netlify.app      │        │  + Groq API              │
└───────────────────┘        └─────────────────────────┘
```

**Netlify** = site web (pages React)
**Railway** = serveur API (routes `/api/*`, base de données, IA)

> ⚠️ Netlify ne peut **pas** faire tourner un serveur Node.js Express.
> Le backend doit obligatoirement être sur Railway (ou Render).

---

## Prérequis à préparer avant de commencer

### 1. Compte GitHub

- Créer un compte sur [github.com](https://github.com) si pas encore fait
- Créer un **nouveau dépôt public ou privé** nommé `revision1g3`

### 2. Compte Netlify

- Créer un compte sur [netlify.com](https://www.netlify.com) (gratuit)
- Connexion recommandée : **"Sign up with GitHub"** (lie les deux comptes)

### 3. Compte Railway

- Créer un compte sur [railway.app](https://railway.app) (gratuit, $5 de crédit/mois)
- Connexion recommandée : **"Login with GitHub"**

### 4. Clés API Groq

- Aller sur [console.groq.com](https://console.groq.com)
- Créer **3 clés API** (pour la rotation) → les noter dans un endroit sûr
- Format : `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5. Générer un JWT_SECRET

Ouvrir un terminal et taper :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

→ Copier la longue chaîne hexadécimale générée (128 caractères)

---

## ÉTAPE 1 — Pousser le projet sur GitHub

### 1.1 Initialiser le remote GitHub

Dans le terminal, depuis `C:\serveurs\htdocs\SiteFR` :

```powershell
git remote add origin https://github.com/TON_USERNAME/revision1g3.git
git branch -M main
git push -u origin main
```

> Si le remote `origin` existe déjà :
>
> ```powershell
> git remote set-url origin https://github.com/TON_USERNAME/revision1g3.git
> git push -u origin main
> ```

### 1.2 Vérifier que `.env` n'est PAS commité

```powershell
git status
```

Le fichier `server/.env` **ne doit pas** apparaître dans la liste. Si c'est le cas :

```powershell
echo "server/.env" >> .gitignore
git rm --cached server/.env
git commit -m "fix: remove .env from tracking"
git push
```

### 1.3 Vérifier que la DB n'est pas commitée

Le fichier `server/data/marin.db` ne doit pas être dans le repo. Le `.gitignore` racine l'exclut normalement.

---

## ÉTAPE 2 — Déployer le backend sur Railway

### 2.1 Créer un nouveau projet Railway

1. Aller sur [railway.app/new](https://railway.app/new)
2. Cliquer **"Deploy from GitHub repo"**
3. Sélectionner le dépôt `revision1g3`
4. Railway détecte automatiquement que c'est un projet Node.js

### 2.2 Configurer le dossier racine du service

Dans les paramètres du service Railway :

- Onglet **Settings** → **Root Directory** → saisir : `server`
- **Build Command** : `npm install`
- **Start Command** : `node src/index.js`

### 2.3 Ajouter un Volume pour SQLite (IMPORTANT — persistance des données)

Sans volume, la base de données est **effacée à chaque redéploiement** (tous les comptes perdus).

1. Dans le projet Railway, cliquer **"+ New"** → **"Volume"**
2. Nom : `sqlite-data`
3. Mount path : `/app/data`
4. Attacher ce volume au service backend

Ensuite, mettre à jour `server/src/db/database.js` pour utiliser ce chemin en production :

```js
// server/src/db/database.js — version production-ready
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// En production Railway : /app/data/marin.db (volume persistant)
// En dev local : server/data/marin.db
const dataDir =
  process.env.NODE_ENV === "production"
    ? "/app/data"
    : path.join(__dirname, "../../data");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "marin.db"));
db.exec("PRAGMA journal_mode = WAL");

export default db;
```

Commiter ce changement avant de déployer :

```powershell
git add server/src/db/database.js
git commit -m "fix(db): use Railway volume path in production"
git push
```

### 2.4 Configurer les variables d'environnement Railway

Dans Railway → Service → onglet **Variables** → ajouter :

| Variable        | Valeur                                         |
| --------------- | ---------------------------------------------- |
| `NODE_ENV`      | `production`                                   |
| `PORT`          | `3001`                                         |
| `GROQ_KEY_1`    | `gsk_ta_premiere_cle_groq`                     |
| `GROQ_KEY_2`    | `gsk_ta_deuxieme_cle_groq`                     |
| `GROQ_KEY_3`    | `gsk_ta_troisieme_cle_groq`                    |
| `JWT_SECRET`    | `la_longue_chaine_generee_a_letape_0`          |
| `CLIENT_ORIGIN` | _(à remplir après avoir créé le site Netlify)_ |

### 2.5 Récupérer l'URL Railway

Après le déploiement (2-3 min) :

- Onglet **Settings** → **Networking** → **Generate Domain**
- L'URL ressemble à : `https://revision1g3-production.up.railway.app`
- **La noter** — elle sera nécessaire pour Netlify

### 2.6 Tester le backend

Dans le navigateur, aller sur :

```
https://revision1g3-production.up.railway.app/api/health
```

→ Doit afficher : `{"status":"ok","time":"...","env":"production"}`

---

## ÉTAPE 3 — Déployer le frontend sur Netlify

### 3.1 Créer un nouveau site Netlify

1. Aller sur [app.netlify.com](https://app.netlify.com)
2. Cliquer **"Add new site"** → **"Import an existing project"**
3. Choisir **GitHub** → sélectionner `revision1g3`

### 3.2 Configurer le build

| Champ                 | Valeur          |
| --------------------- | --------------- |
| **Base directory**    | `client`        |
| **Build command**     | `npm run build` |
| **Publish directory** | `client/dist`   |

> Le fichier `netlify.toml` à la racine configure déjà ces paramètres automatiquement.

### 3.3 Configurer les variables d'environnement Netlify

Avant de déployer : **Site configuration** → **Environment variables** → ajouter :

| Variable       | Valeur                                          |
| -------------- | ----------------------------------------------- |
| `VITE_API_URL` | `https://revision1g3-production.up.railway.app` |

> ⚠️ L'URL doit être l'URL Railway **sans slash final** et **avec https://**

### 3.4 Déployer

Cliquer **"Deploy site"** → attendre 2-3 minutes.

L'URL Netlify ressemble à : `https://graceful-marin-abc123.netlify.app`

### 3.5 (Optionnel) Changer le nom du site

**Site configuration** → **General** → **Change site name** → saisir `revision1g3`
→ L'URL devient : `https://revision1g3.netlify.app`

---

## ÉTAPE 4 — Terminer la configuration CORS

Maintenant que tu as l'URL Netlify, retourner sur Railway et mettre à jour :

| Variable        | Valeur                            |
| --------------- | --------------------------------- |
| `CLIENT_ORIGIN` | `https://revision1g3.netlify.app` |

Railway redéploie automatiquement après chaque modification de variable.

---

## ÉTAPE 5 — Tests de mise en ligne

Ouvrir une **fenêtre de navigation privée** (Ctrl+Maj+N) et aller sur l'URL Netlify.

### Checklist de validation

- [ ] **Page d'accueil** → formulaire "Crée ton compte" s'affiche
- [ ] **Inscription** → créer un compte avec un pseudo et mot de passe
  - Vérifier : redirection automatique vers `/textes`
  - Vérifier : barre de quota affiche 30/30
- [ ] **Liste des textes** → les 6 textes s'affichent en grille
- [ ] **Fiche texte** → cliquer sur "La Promenade de Picasso"
  - Vérifier : introduction, analyse linéaire, procédés s'affichent
  - Vérifier : M. Marin s'affiche à droite (desktop) ou via l'onglet (mobile)
- [ ] **Chat M. Marin** → envoyer "Explique-moi le premier mouvement"
  - Vérifier : réponse reçue en moins de 10 secondes
  - Vérifier : quota passe de 30/30 à 29/30
- [ ] **Connexion** → se déconnecter puis se reconnecter
- [ ] **Mobile** → tester sur téléphone (ou Chrome DevTools)
  - Vérifier : formulaire plein écran, pas de panneau navy
  - Vérifier : onglets Analyse / M. Marin fonctionnent

---

## ÉTAPE 6 — Publier aux élèves

Une fois tous les tests validés :

1. **Communiquer l'URL** : `https://revision1g3.netlify.app`
2. **Instructions pour les élèves** :
   - Créer un compte avec leur prénom (ex : `jules.martin`)
   - Mot de passe : au choix (8 caractères min.)
   - 30 messages par jour, quota rechargé à minuit

---

## Gestion des mises à jour (déploiements futurs)

### Ajouter un nouveau texte

1. Créer le fichier `text_N.txt` avec le contenu
2. Mettre à jour `client/src/data/texts.js` et `server/src/data/texts.js`
3. Commiter et pousser :
   ```powershell
   git add .
   git commit -m "feat(texts): add texte N — Titre (Auteur)"
   git push
   ```
4. Netlify redéploie automatiquement le frontend
5. Railway redéploie automatiquement le backend
6. Les élèves voient le nouveau texte sans rien faire

### Modifier le site

Tout push sur la branche `main` déclenche automatiquement :

- Un redéploiement Netlify (frontend, ~2 min)
- Un redéploiement Railway (backend, ~2 min)

### Réinitialiser un mot de passe élève

Railway n'offre pas de console SQLite directe. Options :

- Ajouter une route admin protégée (future évolution)
- Recréer le compte (l'élève recrée son compte, perd son historique)

---

## Dépannage

| Problème                              | Cause probable                    | Solution                                                 |
| ------------------------------------- | --------------------------------- | -------------------------------------------------------- |
| `CORS error` en production            | `CLIENT_ORIGIN` incorrect         | Vérifier l'URL Netlify exacte dans Railway               |
| Chat IA ne répond pas                 | Clés Groq manquantes ou invalides | Vérifier les variables `GROQ_KEY_*` dans Railway         |
| DB réinitialisée après redéploiement  | Volume Railway non attaché        | Vérifier que le Volume est bien monté sur `/app/data`    |
| `VITE_API_URL` non pris en compte     | Variable ajoutée après le build   | Déclencher un nouveau build manuel sur Netlify           |
| Site Netlify affiche "Page not found" | Redirections SPA manquantes       | Vérifier que `netlify.toml` est bien à la racine du repo |
| Quota IA épuisé rapidement            | Une seule clé Groq                | Ajouter `GROQ_KEY_2` et `GROQ_KEY_3`                     |

---

## Résumé des URLs et variables

```
Site web (Netlify) :    https://revision1g3.netlify.app
API backend (Railway) : https://revision1g3-production.up.railway.app
Health check :          https://revision1g3-production.up.railway.app/api/health
```

```
Variables Railway :
  NODE_ENV=production
  PORT=3001
  JWT_SECRET=<généré>
  GROQ_KEY_1=gsk_...
  GROQ_KEY_2=gsk_...
  GROQ_KEY_3=gsk_...
  CLIENT_ORIGIN=https://revision1g3.netlify.app

Variables Netlify :
  VITE_API_URL=https://revision1g3-production.up.railway.app
```

---

_Guide généré le 2026-06-01 — Projet Revision1G3, Première Générale_
