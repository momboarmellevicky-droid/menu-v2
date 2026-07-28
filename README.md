# MÉNU v2.0 — Ingénieur Numérique IA

Transformez vos idées en applications complètes avec l'IA multi-agents.

## 🏗 Architecture

```
MÉNU/
├── frontend/          # React 19 + Vite + Tailwind v4 + Framer Motion
├── backend/           # Node.js + Express + TypeScript
├── supabase/          # PostgreSQL + Auth + Edge Functions
├── shared/            # Types partagés TypeScript
└── docker-compose.yml # Développement local
```

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- Compte Supabase (gratuit)
- Compte Render (gratuit/payant)
- Compte Vercel (gratuit)
- Clés API OpenAI et/ou Anthropic

### 1. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor** → **New query**
3. Coller le contenu de `supabase/schema.sql`
4. Cliquer **Run**
5. Récupérer les clés dans **Project Settings → API**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (pour le frontend)
   - `SUPABASE_SERVICE_KEY` (pour le backend — garder secret!)

### 2. Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos clés
nano .env
```

### 3. Lancer en local (Docker)

```bash
# Démarrer tous les services
docker-compose up -d

# Ou manuellement :
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev

# Terminal 3 — Redis (optionnel)
docker run -p 6379:6379 redis:7-alpine
```

### 4. Déployer en production

#### Backend sur Render
1. Créer un compte sur [render.com](https://render.com)
2. **New Web Service** → Connecter GitHub
3. Configuration :
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Starter ($7/mois) ou Free
4. Ajouter les variables d'environnement depuis `.env`
5. **Deploy**

#### Frontend sur Vercel
1. Créer un compte sur [vercel.com](https://vercel.com)
2. **Add New Project** → Importer GitHub
3. Configuration :
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Variables d'environnement :
   - `VITE_API_URL`: URL du backend Render
   - `VITE_SUPABASE_URL`: URL Supabase
   - `VITE_SUPABASE_ANON_KEY`: Clé anon Supabase
5. **Deploy**

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---------------|-------------|
| **Multi-Agents IA** | 6 agents (Analyste, Architecte, Designer, Développeur, Testeur, Optimiseur) |
| **Full Stack Generator** | Frontend + Backend + Base de données + API |
| **MÉNU Memory Engine** | Contexte persistant des projets |
| **AI Code Repair** | Correction automatique des erreurs |
| **Voice Creator** | Création par commande vocale |
| **Marketplace** | Templates communautaires |
| **MÉNU Team** | Collaboration en temps réel |
| **One Click Deploy** | Web, PWA, Android, iOS |
| **Analytics** | Tableau de bord de performance |

## 🛠 Stack Technique

| Couche | Technologie |
|--------|------------|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Framer Motion, Zustand |
| **Backend** | Node.js 20, Express, TypeScript, OpenAI/Claude API |
| **Base de données** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (JWT) |
| **Cache** | Redis (Upstash) |
| **Déploiement** | Render (backend), Vercel (frontend) |
| **Stockage** | Supabase Storage |
| **Edge Functions** | Supabase Functions (Deno) |

## 📁 Structure du projet

```
menu-fullstack-v2/
├── frontend/
│   ├── src/
│   │   ├── components/     # UI, layout, sections
│   │   ├── pages/          # 9 pages (Landing, Dashboard, Generate...)
│   │   ├── hooks/          # Custom hooks (auth, generation, voice)
│   │   ├── stores/         # Zustand stores
│   │   ├── lib/            # API client, utils, constants
│   │   └── types/          # Types TypeScript
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/         # Supabase, OpenAI, Redis
│   │   ├── controllers/    # Logique métier
│   │   ├── services/       # IA multi-agents, repair, memory, deploy
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, rate limit, error handling
│   │   ├── types/          # Types TypeScript
│   │   └── utils/          # Logger, validators
│   ├── Dockerfile
│   └── package.json
├── supabase/
│   ├── schema.sql          # Schéma complet PostgreSQL
│   ├── seed.sql            # Données de démo
│   └── functions/          # Edge Functions (Deno)
├── shared/
│   └── types/              # Types partagés frontend/backend
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🎯 Feuille de route

### Phase 1 (Actuel)
- ✅ Multi-agents IA
- ✅ Full Stack Generator
- ✅ Mémoire projet
- ✅ Déploiement automatique
- ✅ Auth Supabase
- ✅ Marketplace

### Phase 2 (Prochaine)
- Voice Creator complet
- Mobile Builder (React Native)
- Connecteurs business (Stripe, SMS, Email)
- Système de crédits

### Phase 3 (Vision)
- MÉNU Academy
- Analytics avancés
- Marketplace mondiale
- White-label pour entreprises

## 👩‍💻 Fondatrice

**MOMBO ARMELLE VICKY**

---

© 2026 MÉNU. Tous droits réservés.