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
  {
    id: 'developer',
    name: 'Développeur',
    role: 'developer',
    systemPrompt: `Tu es un développeur Full Stack React/TypeScript expert. RÈGLES STRICTES :
- Composants React fonctionnels avec hooks
- TypeScript strict (pas de 'any')
- Tailwind CSS pour le styling
- Accessibilité (ARIA labels, roles)
- Props typées avec interfaces
- Gestion d'erreurs avec Error Boundary
- Code splité en fichiers logiques
Génère le code COMPLET et FONCTIONNEL, pas de placeholders.`,
  },
  {
    id: 'tester',
    name: 'Testeur',
    role: 'tester',
    systemPrompt: `Tu es un QA engineer senior. Vérifie le code et retourne en JSON :
- errors: tableau d'erreurs critiques trouvées
- warnings: tableau d'avertissements
- suggestions: tableau d'améliorations
- tests: tableau de tests unitaires suggérés
- coverage: estimation de couverture
Réponds UNIQUEMENT en JSON valide.`,
  },
  {
    id: 'optimizer',
    name: 'Optimiseur',
    role: 'optimizer',
    systemPrompt: `Tu es un expert performance. Optimise le code et retourne :
- optimizedCode: code optimisé complet
- improvements: tableau des améliorations apportées
- metrics: { bundleSize, renderTime, lighthouseScore }
- seo: suggestions SEO
- accessibility: score et améliorations
Réponds avec le code optimisé en premier, puis les métriques.`,
  },
]
export async function runMultiAgentPipeline(
  prompt: string,
  architecture: 'frontend' | 'fullstack' | 'mobile' = 'frontend',
  memory?: ProjectMemory,
  onProgress?: (agent: string, progress: number) => void
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = []

  const enrichedPrompt = memory
    ? `[CONTEXTE PROJET]\nVision: ${memory.vision}\nArchitecture: ${memory.architecture}\nComposants existants: ${memory.components.join(', ')}\n\n[Nouvelle demande]\n${prompt}`
    : prompt

  const cacheKey = await cache.generateKey(enrichedPrompt, architecture)
  const cached = await cache.get(cacheKey)

  if (cached) {
    logger.info('Cache hit pour la génération')
    return JSON.parse(cached)
  }

  try {
    onProgress?.('Analyste', 10)
    const analysis = await callAgent(AGENTS[0], enrichedPrompt)
    results.push(analysis)
    if (analysis.status === 'error') throw new Error(`Erreur Analyste: ${analysis.output}`)

    onProgress?.('Architecte', 25)
    const arch = await callAgent(AGENTS[1], JSON.stringify({ analysis: analysis.output, type: architecture }))
    results.push(arch)

    onProgress?.('Designer', 40)
    const design = await callAgent(AGENTS[2], JSON.stringify({ architecture: arch.output, features: analysis.output }))
    results.push(design)

    onProgress?.('Développeur', 60)
    const dev = await callAgent(AGENTS[3], `
ARCHITECTURE: ${arch.output}
DESIGN: ${design.output}
TYPE: ${architecture}

Génère le code COMPLET pour: ${prompt}
    `)
    results.push(dev)

    onProgress?.('Testeur', 80)
    const test = await callAgent(AGENTS[4], dev.output)
    results.push(test)

    onProgress?.('Optimiseur', 95)
    const optimized = await callAgent(AGENTS[5], `
CODE ORIGINAL:
${dev.output}

RAPPORT TESTS:
${test.output}

Optimise le code en appliquant les corrections suggérées.
    `)
    results.push(optimized)

    onProgress?.('Optimiseur', 100)

    await cache.set(cacheKey, JSON.stringify(results), 7200)

    return results
  } catch (error) {
    logger.error('Erreur pipeline multi-agents:', error)
    throw error
  }
}
async function callAgent(agent: AIAgent, input: string): Promise<GenerationResult> {
  const startTime = Date.now()

  try {
    const response = await anthropic.messages.create({
      model: AI_CONFIG.defaultModel,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      system: agent.systemPrompt,
      messages: [{ role: 'user', content: input }],
    })

    const output = response.content[0].type === 'text' ? response.content[0].text : ''
    const duration = Date.now() - startTime

    logger.info(`Agent ${agent.name} terminé en ${duration}ms`)

    return {
      agent: agent.name,
      output,
      status: 'success',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error(`Erreur agent ${agent.name}:`, error)

    try {
      if (!openai) throw new Error('OpenAI non configuré')

      const fallback = await openai.chat.completions.create({
        model: AI_CONFIG.fallbackModel,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: input },
        ],
      })

      return {
        agent: agent.name,
        output: fallback.choices[0].message.content || '',
        status: 'success',
        timestamp: new Date().toISOString(),
      }
    } catch (fallbackError) {
      return {
        agent: agent.name,
        output: error instanceof Error ? error.message : 'Erreur inconnue',
        status: 'error',
        timestamp: new Date().toISOString(),
      }
    }
  }
}

export async function generateFullStack(
  prompt: string,
  memory?: ProjectMemory,
  onProgress?: (agent: string, progress: number) => void
) {
  const results = await runMultiAgentPipeline(prompt, 'fullstack', memory, onProgress)

  const fullOutput = results[results.length - 1].output

  return {
    frontend: extractCodeBlock(fullOutput, 'tsx') || extractCodeBlock(fullOutput, 'jsx') || fullOutput,
    backend: extractCodeBlock(fullOutput, 'ts') || extractCodeBlock(fullOutput, 'js') || '',
    database: extractCodeBlock(fullOutput, 'sql') || '',
    agents: results,
  }
}

function extractCodeBlock(text: string, language: string): string | null {
  const fence = '```'
  const regex = new RegExp(fence + language + '([\\s\\S]*?)' + fence, 'g')
  const matches = [...text.matchAll(regex)]
  return matches.length > 0 ? matches.map(m => m[1].trim()).join('\n\n') : null
}

export async function generateVoiceCommand(transcript: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: AI_CONFIG.defaultModel,
    max_tokens: 500,
    system: `Tu convertis une commande vocale en prompt technique structuré. 
Extrais l'intention, les fonctionnalités demandées et la technologie suggérée.
Réponds en JSON: { intent, features[], techStack, complexity }`,
    messages: [{ role: 'user', content: transcript }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : transcript
}
