import { Request, Response } from 'express'
import { runMultiAgentPipeline, generateFullStack, extractCodeBlock, extractFilesJson, editProject } from '../services/ai.service'
import { checkSyntax } from '../services/syntaxValidator.service'
import { explainError } from '../services/errorExplainer.service'
import { repairCode } from '../services/codeRepair.service'
import { getProjectMemory, updateProjectMemory, addComponentToMemory } from '../services/memory.service'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import { generateCodeSchema, editCodeSchema } from '../utils/validators'
import { AppError } from '../middleware/error.middleware'

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

    // Génération avec les agents
    const results = await runMultiAgentPipeline(
      prompt,
      architecture,
      memory || undefined,
      (agent, progress) => {
        logger.info(`Progress: ${agent} - ${progress}%`)
      }
    )

    // Extraire le projet final : d'abord en multi-fichiers (nouveau format),
    // avec repli sur l'ancien format fichier unique si l'IA n'a pas respecté
    // le format JSON demandé.
    const finalResult = results[results.length - 1]
    const devResult = results[3]
    const lang = framework === 'react' ? 'tsx' : framework

    const tryExtractSingle = (text: string): string | null =>
      extractCodeBlock(text, lang) ||
      extractCodeBlock(text, 'jsx') ||
      extractCodeBlock(text, 'javascript') ||
      extractCodeBlock(text, 'typescript')

    const looksLikeCode = (s: string) => /\breturn\s*\(/.test(s) || /<[a-zA-Z]/.test(s)

    let files: Record<string, string> | null =
      extractFilesJson(finalResult.output) ||
      (devResult ? extractFilesJson(devResult.output) : null)

    let generatedCode: string

    if (files && files['/src/App.tsx']) {
      generatedCode = files['/src/App.tsx']
    } else {
      // Repli complet ancien comportement (fichier unique)
      let single = tryExtractSingle(finalResult.output)
      if (!single || !looksLikeCode(single)) {
        single = (devResult && tryExtractSingle(devResult.output)) || devResult?.output || finalResult.output
      }
      generatedCode = single
      files = { '/src/App.tsx': single }
    }

    // Réparation automatique du fichier principal
    const repair = await repairCode(generatedCode, framework === 'react' ? 'tsx' : framework)
    files['/src/App.tsx'] = repair.fixedCode

    // Vérification syntaxique réelle : si le code casse (erreur de syntaxe
    // venant de l'IA), on tente une auto-correction avant de livrer quoi
    // que ce soit à l'utilisateur, au lieu de renvoyer une app cassée.
    let syntaxCheck = checkSyntax(files['/src/App.tsx'])
    if (!syntaxCheck.valid) {
      logger.info(`Syntaxe invalide détectée, tentative d'auto-correction: ${syntaxCheck.error}`)
      try {
        const { files: fixedFiles } = await editProject(
          files,
          `Le fichier contient une erreur de syntaxe qui empêche toute compilation : "${syntaxCheck.error}". Corrige UNIQUEMENT cette erreur de syntaxe, sans rien changer d'autre au comportement du code.`
        )
        const fixedMainKey = fixedFiles['/src/App.tsx'] ? '/src/App.tsx' : Object.keys(fixedFiles)[0]
        const secondCheck = checkSyntax(fixedFiles[fixedMainKey])
        if (secondCheck.valid) {
          files = fixedFiles
          logger.info('Auto-correction de syntaxe réussie')
        } else {
          syntaxCheck = secondCheck
        }
      } catch (autoFixError) {
        logger.error('Échec auto-correction syntaxe:', autoFixError)
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

    res.json({
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

  } catch (error) {
    logger.error('Erreur génération:', error)
    if (error instanceof AppError) throw error
    const rawMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const explained = explainError(rawMessage)
    res.status(500).json({ error: 'Erreur de génération', details: explained })
  }
}

export async function editCode(req: Request, res: Response) {
  try {
    const { projectId, instruction } = editCodeSchema.parse(req.body)
    const userId = req.user!.id

    const { data: project } = await supabaseAdmin
      .from('projects')
