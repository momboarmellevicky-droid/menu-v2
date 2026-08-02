import { Router } from 'express'
import { authenticateUser, requireCredits } from '../middleware/auth.middleware'
import { generateLimiter } from '../middleware/rateLimit.middleware'
import { generateCode, generateFullStackProject, generateVoiceCommand, editCode } from '../controllers/generate.controller'

const router = Router()

router.post('/',
  authenticateUser,
  requireCredits(1),
  generateLimiter,
  generateCode
)

router.post('/edit',
  authenticateUser,
  requireCredits(1),
  generateLimiter,
  editCode
)

router.post('/fullstack',
  authenticateUser,
  requireCredits(3),
  generateLimiter,
  generateFullStackProject
)

router.post('/voice',
  authenticateUser,
  generateVoiceCommand
)

export default router
