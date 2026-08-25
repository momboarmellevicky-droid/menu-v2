import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'

export async function getProfile(req: Request, res: Response) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single()

    if (error) throw error

    res.json({
      id: req.user!.id,
      email: req.user!.email,
      name: profile?.full_name || req.user!.email,
      avatar: profile?.avatar_url,
      role: profile?.role || 'user',
      credits: profile?.credits || 0,
    })
  } catch (error) {
    logger.error('Erreur getProfile:', error)
    res.status(500).json({ error: 'Erreur récupération profil' })
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const { full_name, avatar_url } = req.body

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', req.user!.id)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    logger.error('Erreur updateProfile:', error)
    res.status(500).json({ error: 'Erreur mise à jour profil' })
  }
}

export async function getCredits(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('credits, plan')
      .eq('id', req.user!.id)
      .single()

    if (error) throw error

    res.json({ credits: data?.credits || 0, plan: data?.plan || 'free' })
  } catch (error) {
    logger.error('Erreur getCredits:', error)
    res.status(500).json({ error: 'Erreur récupération crédits' })
  }
}
// Suppression de compte réelle, exigée par Google Play et l'App Store depuis
// 2023 (une option de suppression doit être accessible directement dans
// l'app, pas seulement "contactez-nous"). Supprime la ligne profiles ET le
// compte d'authentification Supabase lui-même (irréversible).
export async function deleteAccount(req: Request, res: Response) {
  try {
    const userId = req.user!.id

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      logger.error('Erreur suppression profil:', profileError)
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) throw authError

    logger.info(`Compte supprimé: ${userId}`)
    res.json({ success: true })
  } catch (error) {
    logger.error('Erreur deleteAccount:', error)
    res.status(500).json({ error: 'Erreur suppression du compte' })
  }
}
