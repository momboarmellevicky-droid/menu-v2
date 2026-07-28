import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.middleware'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import { inviteTeamSchema } from '../utils/validators'

const router = Router()

router.get('/:projectId', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select('*, profiles:user_id(full_name, email, avatar_url)')
      .eq('project_id', req.params.projectId)

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    logger.error('Erreur get team:', error)
    res.status(500).json({ error: 'Erreur récupération équipe' })
  }
})

router.post('/invite', authenticateUser, async (req, res) => {
  try {
    const validated = inviteTeamSchema.parse(req.body)

    // Vérifier que l'utilisateur est propriétaire du projet
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', validated.projectId)
      .single()

    if (!project || project.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Accès non autorisé' })
    }

    // Trouver l'utilisateur par email
    const { data: invitedUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', validated.email)
      .single()

    if (!invitedUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Ajouter le membre
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .insert({
        project_id: validated.projectId,
        user_id: invitedUser.id,
        role: validated.role,
        invited_by: req.user!.id,
      })
      .select()
      .single()

    if (error) throw error

    // Ajouter aux collaborateurs du projet
    await supabaseAdmin.rpc('add_collaborator', {
      project_uuid: validated.projectId,
      user_uuid: invitedUser.id,
    })

    res.status(201).json(data)
  } catch (error) {
    logger.error('Erreur invite:', error)
    res.status(500).json({ error: 'Erreur invitation' })
  }
})

router.delete('/:projectId/:userId', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('project_id', req.params.projectId)
      .eq('user_id', req.params.userId)

    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    logger.error('Erreur remove member:', error)
    res.status(500).json({ error: 'Erreur suppression membre' })
  }
})

export default router