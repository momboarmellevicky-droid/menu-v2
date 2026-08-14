import { Request, Response } from 'express'
import { initiateMobileMoneyPayment, checkPaymentStatus, MobileMoneyOperator } from '../services/payment.service'
import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import { AppError } from '../middleware/error.middleware'

const PLANS: Record<string, { amountFcfa: number; credits: number }> = {
  pro: { amountFcfa: 11590, credits: 300 },
  team: { amountFcfa: 29890, credits: 1000 },
}

export async function startSubscriptionPayment(req: Request, res: Response) {
  try {
    const { plan, phoneNumber, operator } = req.body
    const userId = req.user!.id
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip'

    if (plan !== 'pro' && plan !== 'team') {
      throw new AppError("Plan invalide. Valeurs acceptées : 'pro' ou 'team'.", 400)
    }
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new AppError('Numéro de téléphone invalide.', 400)
    }
    if (operator !== 'airtel' && operator !== 'moov') {
      throw new AppError("Opérateur invalide. Valeurs acceptées : 'airtel' ou 'moov'.", 400)
    }

    const { amountFcfa, credits } = PLANS[plan]
    const reference = `subscription:${userId}:${plan}:${Date.now()}`

    // Enregistrement de la tentative AVANT l'appel SingPay, pour ne jamais
    // perdre la trace d'un paiement qui aurait réussi côté SingPay mais
    // dont la réponse n'aurait pas pu être traitée côté serveur.
    const { error: insertError } = await supabaseAdmin.from('menu_payments').insert({
      user_id: userId,
      plan,
      amount_fcfa: amountFcfa,
      operator,
      phone_number: phoneNumber,
      reference,
      status: 'pending',
    })
    if (insertError) throw insertError

    const result = await initiateMobileMoneyPayment({
      amount: amountFcfa,
      phoneNumber,
      operator: operator as MobileMoneyOperator,
      reference,
      description: `MÉNU v2.0 — Abonnement ${plan}`,
      userId,
      ip,
    })

    await supabaseAdmin
      .from('menu_payments')
      .update({
        status: result.status,
        transaction_id: result.transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('reference', reference)

    // SingPay confirme parfois le succès immédiatement à l'initiation (rare,
    // dépend de l'opérateur) — dans ce cas on active tout de suite plutôt
    // que de forcer un second appel de vérification inutile.
    if (result.status === 'success') {
      await activatePlan(userId, plan as 'pro' | 'team', credits)
    }

    res.status(result.success ? 200 : 502).json({ ...result, reference })
  } catch (error: any) {
    logger.error('Erreur startSubscriptionPayment:', error)
    if (error instanceof AppError) throw error
    res.status(500).json({ error: 'Erreur lors du paiement', details: error.message })
  }
}

export async function getSubscriptionPaymentStatus(req: Request, res: Response) {
  try {
    const { reference } = req.params
    const userId = req.user!.id

    const { data: payment, error } = await supabaseAdmin
      .from('menu_payments')
      .select('*')
      .eq('reference', reference)
      .eq('user_id', userId)
      .single()

    if (error || !payment) {
      throw new AppError('Paiement introuvable.', 404)
    }

    // Déjà activé lors d'une vérification précédente : pas besoin de
    // rappeler SingPay.
    if (payment.status === 'success') {
      return res.json({ success: true, status: 'success', message_fr: 'Paiement déjà confirmé.' })
    }

    if (!payment.transaction_id) {
      return res.json({ success: true, status: payment.status, message_fr: 'Paiement en attente d\'initiation.' })
    }

    const result = await checkPaymentStatus(payment.transaction_id, userId)

    if (result.status !== payment.status) {
      await supabaseAdmin
        .from('menu_payments')
        .update({ status: result.status, updated_at: new Date().toISOString() })
        .eq('reference', reference)
    }

    if (result.status === 'success' && payment.status !== 'success') {
      const { credits } = PLANS[payment.plan]
      await activatePlan(userId, payment.plan as 'pro' | 'team', credits)
    }

    res.json(result)
  } catch (error: any) {
    logger.error('Erreur getSubscriptionPaymentStatus:', error)
    if (error instanceof AppError) throw error
    res.status(500).json({ error: 'Erreur lors de la vérification du paiement', details: error.message })
  }
}

async function activatePlan(userId: string, plan: 'pro' | 'team', credits: number) {
  const renewsAt = new Date()
  renewsAt.setMonth(renewsAt.getMonth() + 1)

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      plan,
      credits,
      plan_renews_at: renewsAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    logger.error('Échec activation du plan après paiement réussi:', { userId, plan, error })
    throw error
  }

  logger.info(`Plan ${plan} activé pour l'utilisateur ${userId} (${credits} crédits)`)
}
