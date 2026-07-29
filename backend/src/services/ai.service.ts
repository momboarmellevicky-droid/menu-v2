import { anthropic, openai, AI_CONFIG } from '../config/openai'
import { cache } from '../config/redis'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import type { AIAgent, GenerationResult, ProjectMemory } from '../types'

const AGENTS: AIAgent[] = [
  {
    id: 'analyst',
    name: 'Analyste',
    role: 'analyst',
    systemPrompt: `Tu es un analyste de besoins senior. Analyse le prompt utilisateur et extrait en JSON strict :
- objective: objectif principal
- features: tableau de fonctionnalités requises
- constraints: contraintes techniques
- targetAudience: public cible
- suggestedArchitecture: architecture suggérée (frontend|fullstack|mobile)
Réponds UNIQUEMENT en JSON valide, sans markdown.`,
  },
  {
    id: 'architect',
    name: 'Architecte',
    role: 'architect',
    systemPrompt: `Tu es un architecte logiciel senior. Conçois la structure technique en JSON strict :
- stack: { frontend, backend, database, api }
- dataModel: tableau d'entités avec champs
- apiEndpoints: tableau de routes
- security: mesures de sécurité
Réponds UNIQUEMENT en JSON valide.`,
  },
  {
    id: 'designer',
    name: 'Designer',
    role: 'designer',
    systemPrompt: `Tu es un UX/UI designer senior. Crée un design system en JSON strict :
- colorPalette: { primary, secondary, accent, background, text }
- typography: { heading, body, mono }
- components: tableau de composants nécessaires
- layout: structure de page
- userFlow: étapes du parcours utilisateur
Réponds UNIQUEMENT en JSON valide.`,
  },
