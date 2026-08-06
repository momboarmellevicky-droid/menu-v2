import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.middleware'
import { getProfile, updateProfile, getCredits, deleteAccount } from '../controllers/auth.controller'

const router = Router()

router.get('/profile', authenticateUser, getProfile)
router.patch('/profile', authenticateUser, updateProfile)
router.get('/credits', authenticateUser, getCredits)
router.delete('/account', authenticateUser, deleteAccount)

export default router
