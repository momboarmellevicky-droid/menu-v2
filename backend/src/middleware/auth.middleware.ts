import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
return res.status(401).json({ error: "Token d'authentification manquant" })
    }

    const token = authHeader.split(' ')[1]

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      logger.warn("Tentative d'accès avec token invalide")
      return res.status(401).json({ error: 'Token invalide ou expiré' })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    req.user = {
      id: user.id,
      email: user.email!,
      name: profile?.full_name || user.email!,
      avatar: profile?.avatar_url,
      role: profile?.role || 'user',
      credits: profile?.credits || 0,
    }

    next()
  } catch (error) {
    logger.error('Erreur middleware auth:', error)
    res.status(401).json({ error: 'Authentification échouée' })
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' })
    }
    next()
  }
}

export function requireCredits(minCredits: number = 1) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.credits < minCredits) {
      return res.status(403).json({ 
        error: 'Crédits insuffisants',
        required: minCredits,
        current: req.user?.credits || 0
      })
    }
    next()
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
        avatar?: string
        role: string
        credits: number
      }
    }
  }
}
