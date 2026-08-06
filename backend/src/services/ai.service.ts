import { anthropic, openai, gemini, mistral, AI_CONFIG } from '../config/openai'
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

FORMAT DE RÉPONSE OBLIGATOIRE :
Réponds UNIQUEMENT avec les fichiers séparés par ce marqueur exact, sans JSON, sans échappement, code brut tel qu'il doit apparaître dans le fichier :
###FILE:/src/App.tsx###
(contenu complet et brut du fichier ici, avec ses vrais guillemets et retours à la ligne)
###ENDFILE###
###FILE:/src/components/Board.tsx###
(contenu complet et brut du fichier ici)
###ENDFILE###
Minimum 2 fichiers, maximum 6 fichiers. Le fichier racine doit obligatoirement s'appeler "/src/App.tsx" et exporter un composant par défaut. Rien avant le premier ###FILE:, rien après le dernier ###ENDFILE###. N'entoure JAMAIS le contenu d'un fichier de balises Markdown \`\`\` — ni au début, ni à la fin d'un bloc. Le texte entre ###FILE:chemin### et ###ENDFILE### doit être EXCLUSIVEMENT le code source, rien d'autre.`,
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
    systemPrompt: `Tu es un expert performance. Ta seule tâche est de reprendre le projet multi-fichiers fourni (fichiers séparés par ###FILE:chemin### ... ###ENDFILE###) et de l'optimiser (performance, lisibilité, accessibilité) sans en changer le comportement ni la structure de fichiers.

FORMAT DE RÉPONSE OBLIGATOIRE :
- Réponds UNIQUEMENT avec les MÊMES fichiers (mêmes chemins), au même format ###FILE:chemin### / ###ENDFILE###, code brut sans échappement, avec le contenu optimisé
- Aucun texte avant le premier ###FILE:, aucun texte après le dernier ###ENDFILE###, aucune explication, aucune métrique, aucune phrase de conversation
- Si tu n'as aucune optimisation à apporter, renvoie les fichiers originaux tels quels
- Ne retire et n'ajoute aucun fichier, garde exactement les mêmes chemins`,
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
    if (optimized.status === 'error') {
      results.push({ ...optimized, output: dev.output, status: 'success' })
    } else {
      results.push(optimized)
    }

    onProgress?.('Optimiseur', 100)

    await cache.set(cacheKey, JSON.stringify(results), 7200)

    return results
  } catch (error) {
    logger.error('Erreur pipeline multi-agents:', error)
    throw error
  }
}
// Détecte les imports relatifs (./xxx ou ../xxx) référencés dans les
// fichiers générés mais absents de l'ensemble fourni — sert de base au
// filet de sécurité de generateFullStack qui redemande ces fichiers
// précis à l'IA au lieu de faire échouer tout l'aperçu.
function findMissingRelativeImports(files: Record<string, string>): string[] {
  const existing = new Set(Object.keys(files))
  const missing = new Set<string>()
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g

  for (const [filePath, content] of Object.entries(files)) {
    const fileDir = filePath.substring(0, filePath.lastIndexOf('/')) || ''
    let match: RegExpExecArray | null
    importRegex.lastIndex = 0
    while ((match = importRegex.exec(content)) !== null) {
      const relPath = match[1]
      const segments = (fileDir + '/' + relPath).split('/')
      const resolved: string[] = []
      for (const seg of segments) {
        if (seg === '' || seg === '.') continue
        if (seg === '..') resolved.pop()
        else resolved.push(seg)
      }
      const base = '/' + resolved.join('/')
      const candidates = [base, `${base}.tsx`, `${base}.ts`]
      if (!candidates.some(c => existing.has(c))) {
        missing.add(`${base}.tsx`)
      }
    }
  }

  return Array.from(missing)
}

async function callAgent(agent: AIAgent, input: string): Promise<GenerationResult> {
  const startTime = Date.now()

  // ANTHROPIC_API_KEY absente de menu-v2-backend (confirmé le 5 août) : plutôt
  // que de tenter Claude à chaque appel et remplir les logs d'erreurs
  // d'authentification systématiques avant de basculer sur le repli, on saute
  // directement vers Groq/Gemini — déjà configurées et gratuites — tant que
  // cette clé n'est pas ajoutée. Dès qu'ANTHROPIC_API_KEY sera présente, ce
  // test suffit à réactiver Claude en priorité sans autre changement.
  if (process.env.ANTHROPIC_API_KEY) {
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
      logger.error(`Erreur agent ${agent.name} (Claude):`, error)
    }
  }

  // Gemini essayé avant Groq : plus fiable pour respecter des consignes de
  // format strict (comme "génère exactement N fichiers séparés par des
  // balises") sur ce type de tâche multi-fichiers — confirmé nécessaire le
  // 5 août après un test réel où Groq (Llama 3.3) n'a produit qu'un seul
  // fichier au lieu des 2 à 6 attendus.
  try {
    if (!gemini) throw new Error('Gemini non configuré')

    const model = gemini.getGenerativeModel({
      model: AI_CONFIG.geminiModel,
      systemInstruction: agent.systemPrompt,
    })
    const geminiResult = await model.generateContent(input)
    const geminiOutput = geminiResult.response.text()

    logger.info(`Agent ${agent.name} terminé via Gemini`)

    return {
      agent: agent.name,
      output: geminiOutput,
      status: 'success',
      timestamp: new Date().toISOString(),
    }
  } catch (geminiError) {
    logger.error(`Erreur Gemini pour ${agent.name}`, {
      message: geminiError instanceof Error ? geminiError.message : String(geminiError),
    })

    // Mistral essayé avant Groq : ajouté le 6 août comme 3e repli, pour ne
    // plus dépendre uniquement de Groq (limite basse de 12000 tokens/minute,
    // atteinte à plusieurs reprises lors de tests intensifs) quand Claude et
    // Gemini échouent tous les deux au même moment.
    try {
      if (!mistral) throw new Error('Mistral non configuré')

      const mistralResult = await mistral.chat.completions.create({
        model: AI_CONFIG.mistralModel,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: input },
        ],
      })

      logger.info(`Agent ${agent.name} terminé via Mistral`)

      return {
        agent: agent.name,
        output: mistralResult.choices[0].message.content || '',
        status: 'success',
        timestamp: new Date().toISOString(),
      }
    } catch (mistralError) {
      logger.error(`Erreur Mistral pour ${agent.name}`, {
        message: mistralError instanceof Error ? mistralError.message : String(mistralError),
      })

      try {
        if (!openai) throw new Error('Groq non configuré')

        const fallback = await openai.chat.completions.create({
          model: AI_CONFIG.fallbackModel,
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
          messages: [
            { role: 'system', content: agent.systemPrompt },
            { role: 'user', content: input },
          ],
        })

        logger.info(`Agent ${agent.name} terminé via Groq (dernier recours)`)

        return {
          agent: agent.name,
          output: fallback.choices[0].message.content || '',
          status: 'success',
          timestamp: new Date().toISOString(),
        }
      } catch (groqError) {
        logger.error(`Erreur Groq pour ${agent.name}`, {
          message: groqError instanceof Error ? groqError.message : String(groqError),
        })
        return {
          agent: agent.name,
          output: groqError instanceof Error ? groqError.message : 'Erreur inconnue',
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
  let frontendFiles = extractFilesJson(results[results.length - 1].output)
  let frontendCode = frontendFiles?.['/src/App.tsx'] || results[results.length - 1].output
  if (!frontendFiles) frontendFiles = { '/src/App.tsx': frontendCode }

  // Filet de sécurité contre l'imprévisibilité des modèles gratuits (Groq/
  // Gemini) : confirmé le 5 août par plusieurs tests réels, le modèle
  // génère parfois un App.tsx qui importe des fichiers qu'il n'a jamais
  // créés (aucun bug de code de notre côté — le multi-fichiers fonctionne
  // bien quand l'IA respecte la consigne, elle ne la respecte simplement
  // pas à chaque fois). Plutôt que de faire échouer tout l'aperçu, on
  // détecte les imports manquants et on redemande UNIQUEMENT ces
  // fichiers-là, jusqu'à 2 fois, avant d'abandonner.
  for (let attempt = 0; attempt < 2; attempt++) {
    const missing = findMissingRelativeImports(frontendFiles)
    if (missing.length === 0) break

    onProgress?.(`Complétion des fichiers manquants (${attempt + 1}/2)`, 96)
    const completionResult = await callAgent(
      {
        id: 'completer',
        name: 'Complétion',
        role: 'developer',
        systemPrompt: `Tu complètes un projet React/TypeScript auquel il manque des fichiers. Réponds UNIQUEMENT avec les fichiers manquants au format ###FILE:chemin### suivi du code brut puis ###ENDFILE###, sans balises Markdown, sans JSON, sans aucun texte hors de ce format. N'inclus PAS les fichiers déjà fournis, uniquement ceux listés comme manquants.`,
      },
      `PROJET ACTUEL (fichiers existants) :
${Object.entries(frontendFiles).map(([p, c]) => `###FILE:${p}###\n${c}\n###ENDFILE###`).join('\n')}

FICHIERS MANQUANTS À CRÉER (référencés par un import mais absents ci-dessus) :
${missing.join('\n')}`
    )

    const completedFiles = extractFilesTagged(completionResult.output)
    if (completedFiles) {frontendFiles = { ...frontendFiles, ...completedFiles }
      if (frontendFiles['/src/App.tsx']) frontendCode = frontendFiles['/src/App.tsx']
    } else {
      break // l'IA n'a rien renvoyé d'exploitable, inutile de réessayer encore
    }
  }

  // Auparavant, "Full Stack" ne générait en réalité AUCUN backend ni base de
  // données : la fonction essayait d'extraire du code déjà au fo
