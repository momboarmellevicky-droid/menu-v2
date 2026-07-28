import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.middleware'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import { createProjectSchema } from '../utils/validators'

const router = Router()

router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    logger.error('Erreur get projects:', error)
    res.status(500).json({ error: 'Erreur récupération projets' })
  }
})

router.post('/', authenticateUser, async (req, res) => {
  try {
    const validated = createProjectSchema.parse(req.body)

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: req.user!.id,
        name: validated.name,
        description: validated.description,
        architecture: validated.architecture,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    logger.error('Erreur create project:', error)
    res.status(500).json({ error: 'Erreur création projet' })
  }
})

router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*, generated_codes(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Projet non trouvé' })

    res.json(data)
  } catch (error) {
    logger.error('Erreur get project:', error)
    res.status(500).json({ error: 'Erreur récupération projet' })
  }
})

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)

    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    logger.error('Erreur delete project:', error)
    res.status(500).json({ error: 'Erreur suppression projet' })
  }
})

export default router