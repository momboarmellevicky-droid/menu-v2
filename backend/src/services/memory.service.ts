import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import type { ProjectMemory } from '../types'

export async function getProjectMemory(projectId: string): Promise<ProjectMemory | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('memory')
      .eq('id', projectId)
      .single()

    if (error || !data) return null

    const memory = data.memory as ProjectMemory
    return {
      vision: memory?.vision || '',
      architecture: memory?.architecture || '',
      history: memory?.history || [],
      preferences: memory?.preferences || {},
      components: memory?.components || [],
    }
  } catch (error) {
    logger.error('Erreur récupération mémoire:', error)
    return null
  }
}

export async function updateProjectMemory(
  projectId: string,
  updates: Partial<ProjectMemory>
): Promise<void> {
  try {
    const current = await getProjectMemory(projectId)

    const merged: ProjectMemory = {
      vision: updates.vision ?? current?.vision ?? '',
      architecture: updates.architecture ?? current?.architecture ?? '',
      history: [...(current?.history || []), ...(updates.history || [])].slice(-50),
      preferences: { ...(current?.preferences || {}), ...(updates.preferences || {}) },
      components: [...new Set([...(current?.components || []), ...(updates.components || [])])],
    }

    const { error } = await supabaseAdmin
      .from('projects')
      .update({
        memory: merged,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    if (error) throw error

    logger.info(`Mémoire projet ${projectId} mise à jour`)
  } catch (error) {
    logger.error('Erreur mise à jour mémoire:', error)
    throw error
  }
}

export async function addToHistory(
  projectId: string,
  entry: ProjectMemory['history'][0]
): Promise<void> {
  const current = await getProjectMemory(projectId)
  const history = [...(current?.history || []), entry].slice(-50)

  await supabaseAdmin
    .from('projects')
    .update({
      memory: { ...(current || {}), history },
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
}

export async function addComponentToMemory(
  projectId: string,
  componentName: string
): Promise<void> {
  await updateProjectMemory(projectId, {
    components: [componentName],
  })
}

export async function getProjectContext(projectId: string): Promise<string> {
  const memory = await getProjectMemory(projectId)
  if (!memory) return ''

  return `
[CONTEXTE PROJET]
Vision: ${memory.vision}
Architecture: ${memory.architecture}
Composants existants: ${memory.components.join(', ')}
Historique récent: ${memory.history.slice(-3).map(h => h.description).join(' | ')}
  `.trim()
}