import { Request, Response } from 'express'
import { runMultiAgentPipeline, generateFullStack, extractCodeBlock, extractFilesJson } from '../services/ai.service'
import { repairCode } from '../services/codeRepair.service'
import { getProjectMemory, updateProjectMemory, addComponentToMemory } from '../services/memory.service'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import { generateCodeSchema } from '../utils/validators'
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

    const currentProjectId: string = projectId

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
    res.status(500).json({ error: 'Erreur de génération' })
  }
}

export async function generateFullStackProject(req: Request, res: Response) {
  try {
    const { prompt } = req.body
    const userId = req.user!.id

    if (!prompt) {
      throw new AppError('Prompt requis', 400)
    }

    // Vérifier les crédits (Full Stack = 3 crédits)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (!profile || profile.credits < 3) {
      throw new AppError('Crédits insuffisants pour Full Stack (3 requis)', 403)
    }

    // Créer le projet
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

    // Générer le code Full Stack
    const result = await generateFullStack(prompt)

    // Sauvegarder les résultats
    await supabaseAdmin.from('generated_codes').insert([
      {
        project_id: project.id,
        user_id: userId,
        prompt: `${prompt} - Frontend`,
        code: result.frontend,
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

    // Mettre à jour le statut
    await supabaseAdmin
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', project.id)

    // Décrémenter les crédits
    await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - 3 })
      .eq('id', userId)

    res.json({
      success: true,
      projectId: project.id,
      frontend: result.frontend,
      backend: result.backend,
      database: result.database,
      agents: result.agents.map(a => ({
        name: a.agent,
        status: a.status,
      })),
      creditsRemaining: profile.credits - 3,
    })

  } catch (error) {
    logger.error('Erreur Full Stack:', error)
    if (error instanceof AppError) throw error
    res.status(500).json({ error: 'Erreur génération Full Stack' })
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
