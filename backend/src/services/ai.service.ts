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
    frontendFiles,
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

// Parseur du format à balises ###FILE:chemin### ... ###ENDFILE### — remplace
// le JSON brut comme format d'échange multi-fichiers. Le JSON exigeait que le
// modèle échappe correctement chaque guillemet/retour à ligne/backslash à
// l'intérieur du code généré ; le moindre oubli (fréquent sur du code
// contenant lui-même des guillemets et des template literals) rendait tout
// le JSON.parse invalide et faisait échouer toute la génération avec une
// erreur de syntaxe, sans qu'aucun repli ne puisse la récupérer. Le format à
// balises transporte le code tel quel, sans ré-encodage, donc rien à casser.
//
// Découpage positionnel plutôt que regex non-greedy avec ###ENDFILE### : un
// test réel (4 août) a montré que le modèle omet parfois ###ENDFILE### sur
// un fichier (ou ajoute des balises ``` autour du bloc malgré la consigne),
// ce qui faisait échouer la regex précédente sur TOUT le texte et renvoyait
// le texte brut entier comme contenu d'un seul fichier. Ici, chaque fichier
// commence à un ###FILE:chemin### et s'arrête au ###FILE:...### suivant (ou
// à la fin du texte) — ###ENDFILE### n'est plus nécessaire pour que le
// découpage réussisse, seulement retiré s'il traîne en fin de contenu.
export function extractFilesTagged(text: string): Record<string, string> | null {
  const markerRegex = /###FILE:(.+?)###\r?\n/g
  const markers: { path: string; contentStart: number }[] = []
  let m: RegExpExecArray | null
  while ((m = markerRegex.exec(text)) !== null) {
    markers.push({ path: m[1].trim(), contentStart: m.index + m[0].length })
  }
  if (markers.length === 0) return null

  const files: Record<string, string> = {}
  for (let i = 0; i < markers.length; i++) {
    const { path, contentStart } = markers[i]
    const contentEnd = i + 1 < markers.length ? text.lastIndexOf('###FILE:', markers[i + 1].contentStart) : text.length
    let content = text.slice(contentStart, contentEnd)

    // Retire un ###ENDFILE### de fin s'il est présent, et toute balise
    // Markdown ``` (avec ou sans nom de langage) que le modèle aurait
    // ajoutée en tête ou en fin de bloc malgré la consigne de code brut.
    content = content.replace(/###ENDFILE:?###\s*$/, '')
    content = content.trim()
    content = content.replace(/^```[a-zA-Z]*\r?\n/, '')
    content = content.replace(/\r?\n```$/, '')
    content = content.trim()

    if (path.startsWith('/') && content.length > 0) {
      files[path] = content
    }
  }
  return Object.keys(files).length > 0 ? files : null
}

export function extractFilesJson(text: string): Record<string, string> | null {export function extractFilesJson(text: string): Record<string, string> | null {
  const tagged = extractFilesTagged(text)
  if (tagged) return tagged

  // Repli JSON conservé uniquement pour d'éventuels résultats déjà en cache
  // Redis générés avant ce changement de format.
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

FORMAT DE RÉPONSE OBLIGATOIRE :
Réponds UNIQUEMENT avec les fichiers complets du projet (mêmes chemins que fourni, contenu mis à jour), séparés par ###FILE:chemin### ... ###ENDFILE###, code brut sans échappement JSON. Rien avant le premier ###FILE:, rien après le dernier ###ENDFILE###, pas de markdown.`,
  }

  const input = `PROJET ACTUEL (fichiers séparés par ###FILE:chemin### ... ###ENDFILE###) :
${Object.entries(existingFiles).map(([path, content]) => `###FILE:${path}###\n${content}\n###ENDFILE###`).join('\n')}

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
