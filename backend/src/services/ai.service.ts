import { anthropic, openai, gemini, AI_CONFIG } from '../config/openai'
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
Réponds UNIQUEMENT en JSON valide, sans markdown.

RÈGLE ABSOLUE : le champ "features" doit correspondre EXACTEMENT à ce que l'utilisateur a demandé, ni plus ni moins.
- N'ajoute AUCUNE fonctionnalité que l'utilisateur n'a pas explicitement demandée
- Ne retire AUCUNE fonctionnalité que l'utilisateur a explicitement demandée
- N'interprète pas, ne devine pas, ne "complète" pas la demande avec tes propres idées
- Si la demande est simple et précise, la liste de features doit rester simple et précise`,
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
    systemPrompt: `Tu es un développeur Full Stack React/TypeScript expert qui construit de VRAIS projets multi-fichiers, comme un vrai projet Vite + React (pas un fichier unique compressé).

RÈGLES STRICTES :
- Découpe le projet en plusieurs fichiers logiques : /src/App.tsx (composant racine), /src/components/NomDuComposant.tsx (un fichier par composant réutilisable), /src/types.ts (types partagés si besoin), /src/utils.ts (fonctions utilitaires si besoin)
- Composants React fonctionnels avec hooks
- TypeScript strict (pas de 'any')
- Tailwind CSS pour le styling
- Accessibilité (ARIA labels, roles)
- Props typées avec interfaces
- Chaque composant importe correctement ses dépendances depuis les autres fichiers du projet (chemins relatifs cohérents, ex: import Board from './components/Board')
- Génère le code COMPLET et FONCTIONNEL de chaque fichier, pas de placeholders

FORMAT DE RÉPONSE OBLIGATOIRE — JSON STRICT UNIQUEMENT :
Réponds UNIQUEMENT avec un objet JSON valide (rien avant, rien après, pas de markdown) où chaque clé est un chemin de fichier et chaque valeur le contenu complet du fichier :
{
  "/src/App.tsx": "contenu complet du fichier...",
  "/src/components/Board.tsx": "contenu complet du fichier..."
}
Minimum 2 fichiers, maximum 6 fichiers. Le fichier racine doit obligatoirement s'appeler "/src/App.tsx" et exporter un composant par défaut.`,
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
    systemPrompt: `Tu es un expert performance. Ta seule tâche est de reprendre le projet multi-fichiers fourni (format JSON: chemin de fichier -> contenu) et de l'optimiser (performance, lisibilité, accessibilité) sans en changer le comportement ni la structure de fichiers.

FORMAT DE RÉPONSE OBLIGATOIRE — JSON STRICT UNIQUEMENT :
- Réponds UNIQUEMENT avec le MÊME objet JSON (mêmes clés de fichiers), avec le contenu optimisé
- Aucun texte avant, aucun texte après, aucune explication, aucune métrique, aucune phrase de conversation
- Si tu n'as aucune optimisation à apporter, renvoie l'objet JSON original tel quel
- Ne retire et n'ajoute aucun fichier, garde exactement les mêmes clés`,
  },
]

// Agent Développeur pour le format d'export "HTML" — un vrai fichier HTML
// autonome (CSS + JS inline), sans React ni JSX, contrairement au format
// React qui reste multi-fichiers. Nécessaire car le sélecteur "HTML" dans
// l'interface générait auparavant du React quoi qu'il arrive.
const HTML_DEVELOPER: AIAgent = {
  id: 'developer-html',
  name: 'Développeur',
  role: 'developer',
  systemPrompt: `Tu es un développeur front-end expert en HTML/CSS/JavaScript vanille (sans framework, sans build).

RÈGLES STRICTES :
- Un seul fichier HTML autonome et complet : <!DOCTYPE html>, <head> avec <style> inline, <body> avec le contenu, <script> inline pour toute interactivité
- Aucune dépendance externe à un build (pas de JSX, pas d'import de modules npm), sauf éventuellement une balise <script src="https://cdn..."> si strictement nécessaire (ex: Chart.js)
- HTML sémantique, CSS moderne (flexbox/grid), accessibilité (ARIA, alt, labels)
- JavaScript vanille pour toute interactivité (event listeners, pas de framework)
- Génère le code COMPLET et FONCTIONNEL, pas de placeholders

FORMAT DE RÉPONSE OBLIGATOIRE :
Réponds UNIQUEMENT avec le contenu HTML complet, dans un bloc de code markdown \`\`\`html ... \`\`\`, rien avant, rien après.`,
}

const HTML_OPTIMIZER: AIAgent = {
  id: 'optimizer-html',
  name: 'Optimiseur',
  role: 'optimizer',
  systemPrompt: `Tu es un expert performance web. Reprends le fichier HTML autonome fourni et optimise-le (performance, lisibilité, accessibilité) sans changer son comportement.

FORMAT DE RÉPONSE OBLIGATOIRE :
Réponds UNIQUEMENT avec le HTML complet optimisé, dans un bloc de code markdown \`\`\`html ... \`\`\`, rien avant, rien après. Si aucune optimisation n'est nécessaire, renvoie le fichier original tel quel.`,
}

// Agents réels pour le mode "Full Stack" — auparavant, aucun agent ne
// générait vraiment de backend Express ni de schéma SQL : seul le frontend
// React était produit, sous une étiquette "Full Stack" trompeuse.
const BACKEND_DEVELOPER: AIAgent = {
  id: 'backend-developer',
  name: 'Développeur Backend',
  role: 'developer',
  systemPrompt: `Tu es un développeur backend expert en Node.js/Express/TypeScript qui construit une vraie API REST.

RÈGLES STRICTES :
- Un seul fichier server.ts complet : configuration Express, routes REST cohérentes avec les fonctionnalités demandées, middlewares de base (cors, json body parser)
- TypeScript strict, gestion d'erreurs sur chaque route
- Utilise une connexion PostgreSQL générique (pg ou un client simple), sans supposer une infrastructure spécifique
- Code complet et fonctionnel, pas de placeholders ni de "// TODO"

FORMAT DE RÉPONSE OBLIGATOIRE :
Réponds UNIQUEMENT avec le code TypeScript complet, dans un bloc de code markdown \`\`\`ts ... \`\`\`, rien avant, rien après.`,
}

const DATABASE_DESIGNER: AIAgent = {
  id: 'database-designer',
  name: 'Architecte Base de Données',
  role: 'architect',
  systemPrompt: `Tu es un architecte base de données expert PostgreSQL. À partir du frontend et du backend fournis, écris le schéma SQL complet nécessaire (tables, types, contraintes, index utiles).

RÈGLES STRICTES :
- SQL PostgreSQL valide et complet, prêt à exécuter
- Cohérent avec les entités réellement utilisées par le frontend et le backend fournis
- Inclut les clés primaires/étrangères et les contraintes NOT NULL pertinentes

Réponds UNIQUEMENT avec le SQL complet, dans un bloc de code markdown \`\`\`sql ... \`\`\`, rien avant, rien après.`,
}
export async function runMultiAgentPipeline(
  prompt: string,
  architecture: 'frontend' | 'fullstack' | 'mobile' = 'frontend',
  memory?: ProjectMemory,
  onProgress?: (agent: string, progress: number) => void,
  framework: 'react' | 'html' = 'react'
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = []

  const enrichedPrompt = memory
    ? `[CONTEXTE PROJET]\nVision: ${memory.vision}\nArchitecture: ${memory.architecture}\nComposants existants: ${memory.components.join(', ')}\n\n[Nouvelle demande]\n${prompt}`
    : prompt

  const cacheKey = await cache.generateKey(enrichedPrompt, `${architecture}:${framework}`)
  const cached = await cache.get(cacheKey)

  if (cached) {
    logger.info('Cache hit pour la génération')
    return JSON.parse(cached)
  }

  // Le format choisi par l'utilisateur (React ou HTML) détermine réellement
  // quel agent Développeur/Optimiseur est utilisé — auparavant ce choix
  // n'était jamais transmis au backend et du React était produit dans tous
  // les cas, quel que soit le format sélectionné dans l'interface.
  const developerAgent = framework === 'html' ? HTML_DEVELOPER : AGENTS[3]
  const optimizerAgent = framework === 'html' ? HTML_OPTIMIZER : AGENTS[5]

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
    const dev = await callAgent(developerAgent, `
ARCHITECTURE: ${arch.output}
DESIGN: ${design.output}
TYPE: ${architecture}
FORMAT: ${framework}

Génère le code COMPLET pour: ${prompt}

Respecte strictement cette demande, sans y ajouter de fonctionnalités non demandées.
    `)
    results.push(dev)
    if (dev.status === 'error') throw new Error(`Erreur Développeur: ${dev.output}`)

    onProgress?.('Testeur', 80)
    const test = await callAgent(AGENTS[4], dev.output)
    results.push(test)

    onProgress?.('Optimiseur', 95)
    const optimized = await callAgent(optimizerAgent, `
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
      logger.error(`Erreur fallback Groq pour ${agent.name}`, {
        message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      })

      try {
        if (!gemini) throw new Error('Gemini non configuré')

        const model = gemini.getGenerativeModel({
          model: AI_CONFIG.geminiModel,
          systemInstruction: agent.systemPrompt,
        })
        const geminiResult = await model.generateContent(input)
        const geminiOutput = geminiResult.response.text()

        logger.info(`Agent ${agent.name} terminé via Gemini (fallback niveau 2)`)

        return {
          agent: agent.name,
          output: geminiOutput,
          status: 'success',
          timestamp: new Date().toISOString(),
        }
      } catch (geminiError) {
        logger.error(`Erreur fallback Gemini pour ${agent.name}`, {
          message: geminiError instanceof Error ? geminiError.message : String(geminiError),
          })
        return {
          agent: agent.name,
          output: error instanceof Error ? error.message : 'Erreur inconnue',
          status: 'error',
          timestamp: new Date().toISOString(),
        }
      }
    }
  }
}

export async function generateFullStack(
  prompt: string,
  memory?: ProjectMemory,
  onProgress?: (agent: string, progress: number) => void
) {
  // Le frontend passe par le pipeline habituel (React multi-fichiers).
  const results = await runMultiAgentPipeline(prompt, 'fullstack', memory, onProgress, 'react')
  const frontendFiles = extractFilesJson(results[results.length - 1].output)
  const frontendCode = frontendFiles?.['/src/App.tsx'] || results[results.length - 1].output

  // Auparavant, "Full Stack" ne générait en réalité AUCUN backend ni base de
  // données : la fonction essayait d'extraire du code déjà au format JSON
  // multi-fichiers avec une regex cherchant d'anciens blocs markdown ```ts
  // et ```sql qui n'existaient plus, donc backend/database revenaient
  // toujours vides. Voici les deux vrais agents dédiés à la place.
  onProgress?.('Développeur Backend', 97)
  const backendResult = await callAgent(BACKEND_DEVELOPER, `
FRONTEND GÉNÉRÉ (pour connaître les données et actions nécessaires) :
${frontendCode}

Demande originale : ${prompt}

Écris le backend Express/TypeScript complet correspondant.
  `)

  onProgress?.('Architecte Base de Données', 99)
  const databaseResult = await callAgent(DATABASE_DESIGNER, `
FRONTEND :
${frontendCode}

BACKEND :
${backendResult.output}

Écris le schéma SQL PostgreSQL complet correspondant.
  `)

  const allResults = [...results, backendResult, databaseResult]

  return {
    frontend: frontendCode,
    backend: extractCodeBlock(backendResult.output, 'ts') || extractCodeBlock(backendResult.output, 'typescript') || backendResult.output,
    database: extractCodeBlock(databaseResult.output, 'sql') || databaseResult.output,
    agents: allResults,
  }
}

export function extractCodeBlock(text: string, language: string): string | null {
  const fence = '```'
  const regex = new RegExp(fence + language + '([\\s\\S]*?)' + fence, 'g')
  const matches = [...text.matchAll(regex)]
  return matches.length > 0 ? matches.map(m => m[1].trim()).join('\n\n') : null
}

export function extractFilesJson(text: string): Record<string, string> | null {
  const tryParse = (raw: string): Record<string, string> | null => {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const entries = Object.entries(parsed).filter(
          ([k, v]) => typeof k === 'string' && typeof v === 'string' && k.startsWith('/')
        )
        if (entries.length > 0) return Object.fromEntries(entries) as Record<string, string>
      }
    } catch {
      // ignore, on tente les autres stratégies
    }
    return null
  }

  const direct = tryParse(text.trim())
  if (direct) return direct

  const fenced = extractCodeBlock(text, 'json')
  if (fenced) {
    const parsed = tryParse(fenced)
    if (parsed) return parsed
  }

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const parsed = tryParse(text.slice(start, end + 1))
    if (parsed) return parsed
  }

  return null
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

export async function editProject(
  existingFiles: Record<string, string>,
  instruction: string
): Promise<{ files: Record<string, string>; raw: GenerationResult }> {
  const editorAgent: AIAgent = {
    id: 'editor',
    name: 'Éditeur',
    role: 'developer',
    systemPrompt: `Tu es un développeur React/TypeScript expert chargé de MODIFIER un projet existant selon une instruction précise, PAS de le réécrire depuis zéro.

RÈGLES STRICTES :
- Applique UNIQUEMENT le changement demandé dans l'instruction
- Garde absolument tout le reste du code identique (structure, style, logique non concernée)
- Ne renomme aucun fichier, ne change aucune clé, sauf si l'instruction le demande explicitement
- Si l'instruction nécessite un nouveau fichier, ajoute-le en conservant les fichiers existants
- Le code doit rester complet et fonctionnel après modification

FORMAT DE RÉPONSE OBLIGATOIRE — JSON STRICT UNIQUEMENT :
Réponds UNIQUEMENT avec l'objet JSON complet du projet (mêmes clés que fourni, valeurs mises à jour), rien avant, rien après, pas de markdown.`,
  }

  const input = `PROJET ACTUEL (JSON: chemin de fichier -> contenu) :
${JSON.stringify(existingFiles, null, 2)}

INSTRUCTION DE MODIFICATION DEMANDÉE PAR L'UTILISATEUR :
${instruction}

Renvoie le projet complet mis à jour, au même format JSON.`

  const result = await callAgent(editorAgent, input)

  if (result.status === 'error') {
    throw new Error(`Erreur Éditeur: ${result.output}`)
  }

  const files = extractFilesJson(result.output)
  if (!files) {
    throw new Error("L'éditeur n'a pas renvoyé un projet JSON exploitable")
  }

  return { files, raw: result }
          }
