import Stripe from 'stripe'
import { logger } from '../utils/logger'

// ============================================================================
// MÉNU v2.0 — PASSERELLE DE PAIEMENT STRIPE (carte bancaire, international)
//
// Complète SingPay (Mobile Money Gabon) : Stripe couvre tous les pays où
// Mobile Money n'est pas disponible. Utilise Stripe Checkout (page hébergée
// par Stripe) plutôt qu'un formulaire de carte custom : plus simple, plus
// sûr (aucune donnée de carte ne transite par notre backend), et fonctionne
// bien sur mobile.
// ============================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeClient) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY manquante dans les variables d\'environnement.')
    }
    stripeClient = new Stripe(STRIPE_SECRET_KEY)
  }
  return stripeClient
}

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY)
}

export interface CreateCheckoutParams {
  plan: 'pro' | 'team'
  planLabel: string
  amountUsd: number // en dollars, ex: 20 pour $20.00
  userId: string
  userEmail: string
}

/**
 * Crée une session Stripe Checkout et renvoie l'URL de paiement hébergée.
 * Le montant est facturé en USD, universel, contrairement au FCFA qui ne
 * concerne que la zone Mobile Money Afrique centrale/ouest.
 */
export async function createCheckoutSession(params: CreateCheckoutParams) {
  const stripe = getStripe()
  const { plan, planLabel, amountUsd, userId, userEmail } = params

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(amountUsd * 100), // centimes
          product_data: {
            name: `MÉNU v2.0 — Abonnement ${planLabel}`,
            description: 'Abonnement mensuel — paiement par carte bancaire (international)',
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${FRONTEND_URL}/pricing?stripe_session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
    cancel_url: `${FRONTEND_URL}/pricing?stripe_cancelled=1`,
    metadata: { userId, plan },
  })

  logger.info(`Session Stripe Checkout créée pour l'utilisateur ${userId} (plan ${plan}): ${session.id}`)

  return { url: session.url, sessionId: session.id }
}

export interface StripeVerifyResult {
  paid: boolean
  plan?: string
  userId?: string
}

/**
 * Vérifie l'état réel d'une session Checkout auprès de Stripe (ne fait
 * jamais confiance à un paramètre d'URL seul, qui pourrait être forgé).
 */
export async function verifyCheckoutSession(sessionId: string): Promise<StripeVerifyResult> {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status === 'paid') {
    return {
      paid: true,
      plan: session.metadata?.plan,
      userId: session.metadata?.userId,
    }
  }
  return { paid: false }
}
