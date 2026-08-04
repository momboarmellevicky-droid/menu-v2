import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.middleware'
import { startSubscriptionPayment, getSubscriptionPaymentStatus } from '../controllers/payment.controller'

const router = Router()

router.post('/start', authenticateUser, startSubscriptionPayment)
router.get('/status/:reference', authenticateUser, getSubscriptionPaymentStatus)

export default router
