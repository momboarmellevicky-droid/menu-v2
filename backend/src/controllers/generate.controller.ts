import { Request, Response } from 'express'
import { runMultiAgentPipeline, generateFullStack, extractCodeBlock } from '../services/ai.service'
import { repairCode } from '../services/codeRepair.service'
import { getProjectMemory, updateProjectMemory, addComponentToMemory } from '../services/memory.service'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import { generateCodeSchema } from '../utils/validators'
import { AppError } from '../middleware/error.middleware'

export async function generateCode(req: Request, res: Response) {
  try {
    const validated = generateCodeSchema.parse(req.body)
    const { prompt, framework, architecture, projectId } = validated
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

    // Récupérer la mémoire du projet
    let memory = null
    if (projectId) {
      memory = await getProjectMemory(projectId)
    }

    // Génération avec les agents
    const results = await runMultiAgentPipeline(
      prompt,
      architecture,
      memory || undefined,
      (agent, progress) => {
        // Envoyer les mises à jour via SSE (Server-Sent Events) si implémenté
        logger.info(`Progress: ${agent} - ${progress}%`)
      }
    )

    // Extraire le code final (isole le vrai code, retire la prose de l'IA)
    const finalResult = results[results.length - 1]
    const lang = framework === 'react' ? 'tsx' : framework
    const generatedCode =
      extractCodeBlock(finalResult.output, lang) ||
      extractCodeBlock(finalResult.output, 'jsx') ||
      extractCodeBlock(finalResult.output, 'javascript') ||
      finalResult.output

    // Réparation automatique
    const repair = await repairCode(generatedCode, framework === 'react' ? 'tsx' : framework)

    // Sauvegarder dans Supabase (avec timeout pour éviter un blocage silencieux)
    logger.info('Insertion Supabase generated_codes...')
    const insertPromise = supabaseAdmin
      .from('generated_codes')
      .insert({
        project_id: projectId,
        user_id: userId,
        prompt,
        code: repair.fixedCode,
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

    // Mettre à jour les crédits
    await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - cost })
      .eq('id', userId)

    // Mettre à jour la mémoire du projet
    if (projectId) {
      await addComponentToMemory(projectId, extractComponentName(repair.fixedCode))
      await updateProjectMemory(projectId, {
        history: [{
          id: crypto.randomUUID(),
          type: 'add',
          description: `Génération: ${prompt.slice(0, 100)}`,
          timestamp: new Date().toISOString(),
          author: userId,
        }]
      })
    }

    res.json({
      success: true,
      code: repair.fixedCode,
      id: codeRecord.id,
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
