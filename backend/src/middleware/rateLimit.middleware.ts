import rateLimit from 'express-rate-limit'
import { logger } from '../utils/logger'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Utilisateurs Pro ont plus de requêtes
    return req.user?.role === 'admin' ? 500 : 100
  },
  message: {
    error: 'Trop de requêtes',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé par ${req.ip}`)
    res.status(429).json({
      error: 'Trop de requêtes, veuillez réessayer plus tard',
      retryAfter: 900
    })
  }
})

export const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requêtes/minute
  message: {
    error: 'Limite de génération atteinte',
    limit: '30 requêtes/minute'
  }
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 tentatives de connexion
  skipSuccessfulRequests: true,
  message: {
    error: 'Trop de tentatives de connexion',
    retryAfter: '15 minutes'
  }
})