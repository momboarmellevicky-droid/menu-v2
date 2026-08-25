import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.middleware'
import {
  startSubscriptionPayment,
  getSubscriptionPaymentStatus,
  startStripeCheckout,
  verifyStripeCheckout,
} from '../controllers/payment.controller'

const router = Router()

router.post('/start', authenticateUser, startSubscriptionPayment)
router.get('/status/:reference', authenticateUser, getSubscriptionPaymentStatus)
router.post('/stripe/checkout', authenticateUser, startStripeCheckout)
router.get('/stripe/verify/:sessionId', authenticateUser, verifyStripeCheckout)

export default router
