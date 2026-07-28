# Guide de Déploiement MÉNU v2.0

## 📋 Checklist pré-déploiement

- [ ] Compte Supabase créé et schéma SQL exécuté
- [ ] Clés API OpenAI et/ou Anthropic obtenues
- [ ] Compte Render créé (pour le backend)
- [ ] Compte Vercel créé (pour le frontend)
- [ ] Compte Upstash créé (pour Redis, optionnel)
- [ ] Variables d'environnement configurées

---

## 1. SUPABASE (Base de données + Auth)

### Créer le projet
1. Aller sur [supabase.com](https://supabase.com)
2. Cliquer **"New Project"**
3. Nom: `menu-v2`
4. Région: `eu-west-3` (Paris) ou la plus proche
5. Mot de passe base de données: générer un mot de passe fort
6. Attendre la création (~2 minutes)

### Exécuter le schéma SQL
1. Dans le dashboard, aller dans **"SQL Editor"** (icône `</>`)
2. Cliquer **"New query"**
3. Coller le contenu complet de `supabase/schema.sql`
4. Cliquer **"Run"**
5. Vérifier le message: **"Tables créées avec succès"**

### Récupérer les clés
1. Aller dans **"Project Settings"** → **"API"**
2. Copier et noter:
   - `URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY` (pour le frontend)
   - `service_role secret` → `SUPABASE_SERVICE_KEY` (pour le backend — **NE JAMAIS EXPOSER**)

### Configurer l'auth
1. Aller dans **"Authentication"** → **"Providers"**
2. Activer **Email** (déjà activé par défaut)
3. Optionnel: Activer **Google OAuth** (pour la connexion Google)
4. Dans **"URL Configuration"**, ajouter:
   - Site URL: `https://your-frontend.vercel.app`
   - Redirect URLs: `https://your-frontend.vercel.app/login`

---

## 2. RENDER (Backend Node.js)

### Créer le service
1. Aller sur [render.com](https://render.com)
2. **"New"** → **"Web Service"**
3. Connecter votre repo GitHub contenant le projet
4. Configuration:
   - **Name**: `menu-backend`
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Starter` ($7/mois) recommandé (le plan Free s'endort après 15 min d'inactivité)

### Variables d'environnement
Ajouter toutes ces variables dans **"Environment"**:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PROJECT_ID=your-project-id
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
REDIS_URL=rediss://your-upstash-url (optionnel)
REDIS_TOKEN=your-upstash-token (optionnel)
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
JWT_SECRET=your-jwt-secret-min-32-characters
LOG_LEVEL=info
```

### Déployer
1. Cliquer **"Create Web Service"**
2. Attendre le build (~2-3 minutes)
3. Vérifier le health check: `https://menu-backend.onrender.com/health`
4. Noter l'URL: `https://menu-backend.onrender.com`

---

## 3. VERCEL (Frontend React)

### Créer le projet
1. Aller sur [vercel.com](https://vercel.com)
2. **"Add New Project"** → Importer le repo GitHub
3. Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Variables d'environnement
Ajouter dans **"Environment Variables"**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://menu-backend.onrender.com/api
```

### Déployer
1. Cliquer **"Deploy"**
2. Attendre le build (~1-2 minutes)
3. L'URL sera: `https://menu-frontend.vercel.app`

### Mettre à jour Supabase
1. Retourner dans Supabase → **"Authentication"** → **"URL Configuration"**
2. Mettre à jour:
   - Site URL: `https://menu-frontend.vercel.app`
   - Redirect URLs: `https://menu-frontend.vercel.app/login`

---

## 4. UPSTASH REDIS (Optionnel — Cache)

1. Aller sur [upstash.com](https://upstash.com)
2. Créer un compte gratuit
3. **"Create Database"**
4. Choisir la région la plus proche de votre backend Render
5. Copier:
   - `UPSTASH_REDIS_REST_URL` → `REDIS_URL`
   - `UPSTASH_REDIS_REST_TOKEN` → `REDIS_TOKEN`
6. Ajouter ces variables dans Render

---

## 5. VÉRIFICATION POST-DÉPLOIEMENT

### Test API
```bash
curl https://menu-backend.onrender.com/health
# Doit retourner: {"status":"ok","version":"2.0.0"}
```

### Test Auth
1. Ouvrir le frontend Vercel
2. Créer un compte avec email/mot de passe
3. Vérifier dans Supabase → **"Table Editor"** → `profiles` que l'utilisateur apparaît

### Test Génération
1. Se connecter sur le frontend
2. Aller sur **"Générer"**
3. Entrer un prompt: `"Crée un bouton principal avec loader"`
4. Vérifier que:
   - Les agents s'exécutent (progression visible)
   - Le code est généré
   - Les crédits sont décrémentés (vérif dans Supabase `profiles`)

### Test Full Stack
1. Choisir **"Mode Full Stack"**
2. Entrer: `"Crée une application de gestion pour mon restaurant"`
3. Vérifier que 3 fichiers sont créés (frontend, backend, database)

---

## 🔧 Dépannage

### Erreur CORS
- Vérifier que `FRONTEND_URL` dans Render correspond exactement à l'URL Vercel
- Vérifier que l'URL n'a pas de `/` à la fin

### Erreur "Crédits insuffisants"
- Vérifier dans Supabase que le profil a `credits > 0`
- Le trigger `handle_new_user` doit donner 30 crédits à l'inscription

### Erreur IA "API key invalid"
- Vérifier que `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY` est correcte
- Vérifier que la clé a des crédits disponibles

### Backend ne démarre pas
- Vérifier les logs dans Render → **"Logs"**
- Vérifier que `SUPABASE_SERVICE_KEY` est correcte (pas la anon key)
- Vérifier que `PORT` est bien `3001` (ou laisser Render gérer)

---

## 🔄 Mise à jour

Pour mettre à jour le déploiement:

```bash
# 1. Pousser les changements sur GitHub
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# 2. Render et Vercel déploient automatiquement
# 3. Vérifier les logs si erreur
```

---

## 📞 Support

- **Documentation Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Documentation Render**: [render.com/docs](https://render.com/docs)
- **Documentation Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **OpenAI API**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Anthropic API**: [docs.anthropic.com](https://docs.anthropic.com)