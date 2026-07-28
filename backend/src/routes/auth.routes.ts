import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.middleware'
import { getProfile, updateProfile, getCredits } from '../controllers/auth.controller'

const router = Router()

router.get('/profile', authenticateUser, getProfile)
router.patch('/profile', authenticateUser, updateProfile)
router.get('/credits', authenticateUser, getCredits)

export default router