import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.middleware'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query

    let query = supabaseAdmin
      .from('marketplace_items')
      .select('*')
      .eq('is_approved', true)

    if (category) query = query.eq('category', category)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error } = await query.order('downloads', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    logger.error('Erreur marketplace:', error)
    res.status(500).json({ error: 'Erreur récupération marketplace' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('marketplace_items')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Item non trouvé' })

    res.json(data)
  } catch (error) {
    logger.error('Erreur get marketplace item:', error)
    res.status(500).json({ error: 'Erreur récupération item' })
  }
})

router.post('/:id/download', authenticateUser, async (req, res) => {
  try {
    // Incrémenter les downloads
    await supabaseAdmin.rpc('increment_downloads', { item_id: req.params.id })

    const { data, error } = await supabaseAdmin
      .from('marketplace_items')
      .select('code')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json({ code: data?.code })
  } catch (error) {
    logger.error('Erreur download:', error)
    res.status(500).json({ error: 'Erreur téléchargement' })
  }
})

export default router