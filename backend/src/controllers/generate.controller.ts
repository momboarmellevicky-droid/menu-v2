import { Request, Response } from 'express'
import { runMultiAgentPipeline, generateFullStack, extractCodeBlock, extractFilesJson, editProject } from '../services/ai.service'
import { checkSyntax, checkHtmlValidity } from '../services/syntaxValidator.service'
import { explainError } from '../services/errorExplainer.service'
import { repairCode } from '../services/codeRepair.service'
import { getProjectMemory, updateProjectMemory, addComponentToMemory } from '../services/memory.service'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import { generateCodeSchema, editCodeSchema } from '../utils/validators'
import { AppError } from '../middleware/error.middleware'

// Canal SSE réel : remplace la barre de progression simulée côté client.
// startSSE ouvre le flux, sendEvent pousse chaque étape au fur et à mesure
// qu'elle se produit réellement côté serveur (plus de simulation par
// setInterval côté frontend), endSSE ferme la connexion.
function startSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
}

function sendEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function endSSE(res: Response) {
  res.end()
}

export async function generateCode(req: Request, res: Response) {
  try {
    const validated = generateCodeSchema.parse(req.body)
    const { prompt, framework, architecture } = validated
    let { projectId } = validated
    const userId = req.user!.id

    // Vérifier les crédits
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    const cost = architecture === 'fullstack' ? 3 : 1
    if (!profile || profile.credits < cost) {
      throw new AppError('Crédits insuffisants. Passez au plan Pro.', 403)
    }

    // Créer un vrai projet si aucun n'est fourni (chaque génération doit
    // correspondre à un projet réel, visible et cliquable dans "Vos projets")
    if (!projectId) {
      const { data: newProject, error: newProjectError } = await supabaseAdmin
        .from('projects')
        .insert({
          user_id: userId,
          name: prompt.slice(0, 60),
          description: prompt,
          architecture,
          status: 'generating',
        })
        .select('id')
        .single()

      if (newProjectError) throw newProjectError
      projectId = newProject.id
    }

    const currentProjectId: string = projectId as string

    // Récupérer la mémoire du projet
    const memory = await getProjectMemory(currentProjectId)

    // À partir d'ici la réponse devient un flux SSE réel : chaque étape est
    // poussée au frontend au moment où elle se produit réellement côté
    // serveur (remplace la barre de progression simulée côté client).
    startSSE(res)
    sendEvent(res, 'progress', { agent: 'Analyste', progress: 0 })

    // Génération avec les agents — le format choisi (React ou HTML) est
    // désormais réellement transmis et influence quel agent Développeur
    // est utilisé (auparavant ce choix était ignoré, du React était
    // toujours produit quel que soit le format sélectionné).
    const results = await runMultiAgentPipeline(
      prompt,
      architecture,
      memory || undefined,
      (agent, progress) => {
        logger.info(`Progress: ${agent} - ${progress}%`)
        sendEvent(res, 'progress', { agent, progress })
      },
      framework === 'html' ? 'html' : 'react'
    )

    const finalResult = results[results.length - 1]
    const devResult = results[3]

    let files: Record<string, string>
    let mainFileKey: string

    if (framework === 'html') {
      const htmlContent =
        extractCodeBlock(finalResult.output, 'html') ||
        extractCodeBlock(devResult.output, 'html') ||
        finalResult.output
      mainFileKey = '/index.html'
      files = { [mainFileKey]: htmlContent }
    } else {
      // Extraire le projet final : d'abord en multi-fichiers (nouveau format),
      // avec repli sur l'ancien format fichier unique si l'IA n'a pas respecté
      // le format JSON demandé.
      const lang = 'tsx'
      const tryExtractSingle = (text: string): string | null =>
        extractCodeBlock(text, lang) ||
        extractCodeBlock(text, 'jsx') ||
        extractCodeBlock(text, 'javascript') ||
        extractCodeBlock(text, 'typescript')

      const looksLikeCode = (s: string) => /\breturn\s*\(/.test(s) || /<[a-zA-Z]/.test(s)

      let extractedFiles: Record<string, string> | null =
        extractFilesJson(finalResult.output) ||
        (devResult ? extractFilesJson(devResult.output) : null)

      mainFileKey = '/src/App.tsx'

      if (extractedFiles && extractedFiles[mainFileKey]) {
        files = extractedFiles
      } else {
        // Repli complet ancien comportement (fichier unique)
        let single = tryExtractSingle(finalResult.output)
        if (!single || !looksLikeCode(single)) {
          single = (devResult && tryExtractSingle(devResult.output)) || devResult?.output || finalResult.output
        }
        files = { [mainFileKey]: single }
      }
    }

    // Réparation automatique du fichier principal
    const repair = await repairCode(files[mainFileKey], framework === 'html' ? 'html' : 'tsx')
    files[mainFileKey] = repair.fixedCode

    // Vérification de validité réelle : pour React/TS, un vrai parseur
    // Babel ; pour HTML, une vérification structurelle dédiée. Si le code
    // casse, on tente une auto-correction avant de livrer quoi que ce soit
    // à l'utilisateur, au lieu de renvoyer une app cassée.
    let syntaxCheck = framework === 'html' ? checkHtmlValidity(files[mainFileKey]) : checkSyntax(files[mainFileKey])
    if (!syntaxCheck.valid) {
      logger.info(`Contenu invalide détecté, tentative d'auto-correction: ${syntaxCheck.error}`)
      sendEvent(res, 'progress', { agent: 'Correction automatique', progress: 97 })
      try {
        const { files: fixedFiles } = await editProject(
          files,
          `Le fichier contient une erreur qui empêche son utilisation : "${syntaxCheck.error}". Corrige UNIQUEMENT cette erreur, sans rien changer d'autre au comportement du code.`
        )
        const fixedMainKey = fixedFiles[mainFileKey] ? mainFileKey : Object.keys(fixedFiles)[0]
        const secondCheck = framework === 'html' ? checkHtmlValidity(fixedFiles[fixedMainKey]) : checkSyntax(fixedFiles[fixedMainKey])
        if (secondCheck.valid) {
          files = fixedFiles
          logger.info('Auto-correction réussie')
        } else {
          syntaxCheck = secondCheck
        }
      } catch (autoFixError) {
        logger.error('Échec auto-correction:', autoFixError)
      }
    }

    if (!syntaxCheck.valid) {
      throw new Error(`Erreur de syntaxe non corrigeable automatiquement: ${syntaxCheck.error}`)
    }

    // Sauvegarder dans Supabase (avec timeout pour éviter un blocage silencieux)
    logger.info('Insertion Supabase generated_codes...')
    const insertPromise = supabaseAdmin
      .from('generated_codes')
      .insert({
        project_id: currentProjectId,
        user_id: userId,
        prompt,
        code: repair.fixedCode,
        files,
        language: framework === 'react' ? 'tsx' : framework,
        framework,
        agent_logs: results.map(r => ({
          agent: r.agent,
          status: r.status,
          timestamp: r.timestamp
        })),
      })
      .select()
      .single()

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout insertion Supabase (15s)')), 15000)
    )

    const { data: codeRecord, error } = await Promise.race([insertPromise, timeoutPromise]) as any
    logger.info('Insertion Supabase generated_codes: OK')

    if (error) throw error

    // Marquer le projet comme terminé
    await supabaseAdmin
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', currentProjectId)

    // Mettre à jour les crédits
    await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - cost })
      .eq('id', userId)

    // Mettre à jour la mémoire du projet
    await addComponentToMemory(currentProjectId, extractComponentName(repair.fixedCode))
    await updateProjectMemory(currentProjectId, {
      history: [{
        id: crypto.randomUUID(),
        type: 'add',
        description: `Génération: ${prompt.slice(0, 100)}`,
        timestamp: new Date().toISOString(),
        author: userId,
      }]
    })

    sendEvent(res, 'done', {
      success: true,
      code: repair.fixedCode,
      files,
      id: codeRecord.id,
      projectId: currentProjectId,
      agents: results.map(r => ({
        name: r.agent,
        status: r.status,
        timestamp: r.timestamp
      })),
      repair: {
        fixed: repair.fixed,
        warnings: repair.warnings,
        errors: repair.errors,
      },
      creditsRemaining: profile.credits - cost,
    })
    endSSE(res)

  } catch (error) {
    logger.error('Erreur génération:', error)
    const rawMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const explained = explainError(rawMessage)
    if (res.headersSent) {
      // Le flux SSE est déjà ouvert : impossible d'envoyer un statut HTTP,
      // on pousse l'erreur comme événement et on ferme le flux.
      sendEvent(res, 'error', { error: 'Erreur de génération', details: explained })
      endSSE(res)
      return
    }
    if (error instanceof AppError) throw error
    res.status(500).json({ error: 'Erreur de génération', details: explained })
  }
}

export async function editCode(req: Request, res: Response) {
  try {
    const { projectId, instruction } = editCodeSchema.parse(req.body)
    const userId = req.user!.id

    const { data: project } = await supabaseAdmin
      .from('projects')
    .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!project) {
      throw new AppError('Projet introuvable ou vous ne le possédez pas', 404)
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (!profile || profile.credits < 1) {
      throw new AppError('Crédits insuffisants. Passez au plan Pro.', 403)
    }

    const { data: latestCode, error: latestError } = await supabaseAdmin
      .from('generated_codes')
      .select('files, code, language, framework, prompt')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) throw latestError
    if (!latestCode) {
      throw new AppError('Aucun code existant à modifier pour ce projet. Générez-le d\'abord.', 400)
    }

    const existingFiles: Record<string, string> =
      latestCode.files && Object.keys(latestCode.files).length > 0
        ? latestCode.files
        : { '/src/App.tsx': latestCode.code }

    // Édition = un seul agent (pas de pipeline multi-étapes), mais le flux
    // SSE reste réel : un événement au démarrage, un événement 'done' à la fin.
    startSSE(res)
    sendEvent(res, 'progress', { agent: 'Éditeur', progress: 20 })

    const { files: editedFiles, raw } = await editProject(existingFiles, instruction)
    sendEvent(res, 'progress', { agent: 'Éditeur', progress: 90 })

    const mainKey = editedFiles['/src/App.tsx'] ? '/src/App.tsx' : Object.keys(editedFiles)[0]
    const repair = await repairCode(editedFiles[mainKey], latestCode.language === 'tsx' ? 'tsx' : latestCode.language)
    editedFiles[mainKey] = repair.fixedCode

    const { data: codeRecord, error: insertError } = await supabaseAdmin
      .from('generated_codes')
      .insert({
        project_id: projectId,
        user_id: userId,
        prompt: `Édition: ${instruction.slice(0, 100)}`,
        code: repair.fixedCode,
        files: editedFiles,
        language: latestCode.language,
        framework: latestCode.framework,
        agent_logs: [{ agent: raw.agent, status: raw.status, timestamp: raw.timestamp }],
      })
      .select()
      .single()

    if (insertError) throw insertError

    await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', userId)

    await updateProjectMemory(projectId, {
      history: [{
        id: crypto.randomUUID(),
        type: 'edit',
        description: `Édition: ${instruction.slice(0, 100)}`,
        timestamp: new Date().toISOString(),
        author: userId,
      }]
    })

    sendEvent(res, 'done', {
      success: true,
      code: repair.fixedCode,
      files: editedFiles,
      id: codeRecord.id,
      projectId,
      repair: {
        fixed: repair.fixed,
        warnings: repair.warnings,
        errors: repair.errors,
      },
      creditsRemaining: profile.credits - 1,
    })
    endSSE(res)

  } catch (error) {
    logger.error('Erreur édition:', error)
    const rawMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const explained = explainError(rawMessage)
    if (res.headersSent) {
      sendEvent(res, 'error', { error: "Erreur d'édition", details: explained })
      endSSE(res)
      return
    }
    if (error instanceof AppError) throw error
    res.status(500).json({ error: "Erreur d'édition", details: explained })
  }
}

export async function generateFullStackProject(req: Request, res: Response) {
  try {
    const { prompt } = req.body
    const userId = req.user!.id

    if (!prompt) {
      throw new AppError('Prompt requis', 400)
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (!profile || profile.credits < 3) {
      throw new AppError('Crédits insuffisants pour Full Stack (3 requis)', 403)
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: userId,
        name: prompt.slice(0, 50),
        description: prompt,
        architecture: 'fullstack',
        status: 'generating',
      })
      .select()
      .single()

    if (projectError) throw projectError

    startSSE(res)
    sendEvent(res, 'progress', { agent: 'Analyste', progress: 0 })

    const result = await generateFullStack(prompt, undefined, (agent, progress) => {
      logger.info(`Progress Full Stack: ${agent} - ${progress}%`)
      sendEvent(res, 'progress', { agent, progress })
    })

    // Même filet de sécurité que la génération simple : si le frontend
    // extrait ne compile pas (le format à balises réduit le risque mais ne
    // l'élimine pas si l'IA dévie du format demandé), on tente une
    // auto-correction avant de sauvegarder quoi que ce soit.
    const frontendCheck = checkSyntax(result.frontend)
    if (!frontendCheck.valid) {
      logger.info(`Frontend Full Stack invalide, tentative d'auto-correction: ${frontendCheck.error}`)
      sendEvent(res, 'progress', { agent: 'Correction automatique', progress: 99 })
      try {
        const { files: fixedFiles } = await editProject(
          { '/src/App.tsx': result.frontend },
          `Le fichier contient une erreur qui empêche son utilisation : "${frontendCheck.error}". Corrige UNIQUEMENT cette erreur, sans rien changer d'autre au comportement du code.`
        )
        if (fixedFiles['/src/App.tsx'] && checkSyntax(fixedFiles['/src/App.tsx']).valid) {
          result.frontend = fixedFiles['/src/App.tsx']
          result.frontendFiles = { ...result.frontendFiles, '/src/App.tsx': fixedFiles['/src/App.tsx'] }
        }
      } catch (repairError) {
        logger.error('Échec auto-correction frontend Full Stack:', repairError)
      }
    }

    await supabaseAdmin.from('generated_codes').insert([
      {
        project_id: project.id,
        user_id: userId,
        prompt: `${prompt} - Frontend`,
        code: result.frontend,
        files: result.frontendFiles,
        language: 'tsx',
        framework: 'react',
      },
      {
        project_id: project.id,
        user_id: userId,
        prompt: `${prompt} - Backend`,
        code: result.backend,
        language: 'ts',
        framework: 'node',
      },
      {
        project_id: project.id,
        user_id: userId,
        prompt: `${prompt} - Database`,
        code: result.database,
        language: 'sql',
        framework: 'postgresql',
      },
    ])

    await supabaseAdmin
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', project.id)

    await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - 3 })
      .eq('id', userId)

    sendEvent(res, 'done', {
      success: true,
      projectId: project.id,
      frontend: result.frontend,
      files: result.frontendFiles,
      backend: result.backend,
      database: result.database,
      agents: result.agents.map(a => ({
        name: a.agent,
        status: a.status,
      })),
      creditsRemaining: profile.credits - 3,
    })
    endSSE(res)

  } catch (error) {
    logger.error('Erreur Full Stack:', error)
    const rawMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const explained = explainError(rawMessage)
    if (res.headersSent) {
      sendEvent(res, 'error', { error: 'Erreur génération Full Stack', details: explained })
      endSSE(res)
      return
    }
    if (error instanceof AppError) throw error
    res.status(500).json({ error: 'Erreur génération Full Stack', details: explained })
  }
}

export async function generateVoiceCommand(req: Request, res: Response) {
  try {
    const { transcript } = req.body

    if (!transcript) {
      throw new AppError('Transcription requise', 400)
    }

    const { generateVoiceCommand } = await import('../services/ai.service')
    const structuredPrompt = await generateVoiceCommand(transcript)

    res.json({
      success: true,
      original: transcript,
      structured: structuredPrompt,
    })
  } catch (error) {
    logger.error('Erreur voice command:', error)
    res.status(500).json({ error: 'Erreur traitement vocal' })
  }
}

function extractComponentName(code: string): string {
  const match = code.match(/export\s+default\s+function\s+(\w+)/)
  return match?.[1] || 'GeneratedComponent'
        }
