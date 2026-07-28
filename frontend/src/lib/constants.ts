export const APP_NAME = 'MÉNU'
export const APP_VERSION = '2.0.0'
export const APP_TAGLINE = 'Ingénieur Numérique IA'

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  GENERATE: '/generate',
  LOGIN: '/login',
  MARKETPLACE: '/marketplace',
  TEAM: '/team',
  DEPLOY: '/deploy',
  ANALYTICS: '/analytics',
} as const

export const AI_AGENTS = [
  { id: 'analyst', name: 'Analyste', role: 'analyst' as const, icon: 'Search' },
  { id: 'architect', name: 'Architecte', role: 'architect' as const, icon: 'Layers' },
  { id: 'designer', name: 'Designer', role: 'designer' as const, icon: 'Palette' },
  { id: 'developer', name: 'Développeur', role: 'developer' as const, icon: 'Code2' },
  { id: 'tester', name: 'Testeur', role: 'tester' as const, icon: 'Bug' },
  { id: 'optimizer', name: 'Optimiseur', role: 'optimizer' as const, icon: 'Zap' },
] as const

export const FEATURES = [
  {
    icon: 'Code2',
    title: 'Multi-Agents IA',
    description: '6 agents spécialisés analysent, architectent, designent, codent, testent et optimisent votre application.',
  },
  {
    icon: 'Layers',
    title: 'Full Stack Generator',
    description: 'Générez frontend, backend, base de données, API et authentification en une seule commande.',
  },
  {
    icon: 'Brain',
    title: 'MÉNU Memory Engine',
    description: 'L'IA conserve le contexte complet de votre projet : architecture, historique, préférences.',
  },
  {
    icon: 'Wrench',
    title: 'AI Code Repair',
    description: 'Détection et correction automatique des erreurs en temps réel pendant la génération.',
  },
  {
    icon: 'Store',
    title: 'Marketplace',
    description: 'Bibliothèque communautaire de composants, dashboards, CRM et modèles métiers prêts à l'emploi.',
  },
  {
    icon: 'Users',
    title: 'MÉNU Team',
    description: 'Collaboration en temps réel : partage de projets, commentaires, rôles et permissions.',
  },
  {
    icon: 'Rocket',
    title: 'One Click Deploy',
    description: 'Déploiement instantané sur Web, PWA, Android et iOS depuis un seul bouton.',
  },
  {
    icon: 'Smartphone',
    title: 'Mobile Builder',
    description: 'Générez des applications mobiles natives avec React Native et Expo.',
  },
  {
    icon: 'Mic',
    title: 'Voice Creator',
    description: 'Créez des applications entières rien qu'en parlant. L'IA comprend et construit.',
  },
] as const

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Décrivez',
    description: 'Expliquez votre idée en langage naturel, par texte ou par la voix.',
    color: 'from-secondary to-primary',
  },
  {
    step: 2,
    title: 'Analyse IA',
    description: 'Nos 6 agents IA analysent, architectent et designent votre application.',
    color: 'from-primary to-secondary',
  },
  {
    step: 3,
    title: 'Générez',
    description: 'Le code React/TypeScript Full Stack est produit, testé et optimisé.',
    color: 'from-secondary to-primary',
  },
  {
    step: 4,
    title: 'Déployez',
    description: 'Publiez en un clic sur Web, PWA, Android ou iOS.',
    color: 'from-primary to-secondary',
  },
] as const

export const ROADMAP = [
  {
    phase: 'Phase 1',
    period: '1-3 mois',
    items: ['Multi-agents IA', 'Correction auto du code', 'Mémoire projet', 'Génération Full Stack', 'Déploiement automatique'],
    status: 'in-progress' as const,
  },
  {
    phase: 'Phase 2',
    period: '3-6 mois',
    items: ['Voice Creator', 'Marketplace', 'Mobile Builder', 'Connecteurs business'],
    status: 'planned' as const,
  },
  {
    phase: 'Phase 3',
    period: '6-18 mois',
    items: ['MÉNU Academy', 'Système de crédits', 'Analytics avancés', 'Marketplace mondiale'],
    status: 'planned' as const,
  },
] as const

export const CREDITS = {
  FREE: { name: 'Gratuit', requests: 30, price: 0 },
  PRO: { name: 'Pro', requests: 500, price: 29 },
  ENTERPRISE: { name: 'Entreprise', requests: -1, price: 99 },
} as const