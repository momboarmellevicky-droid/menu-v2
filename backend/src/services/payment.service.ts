import { logger } from '../utils/logger'

// ============================================================================
// MÉNU v2.0 — PASSERELLE DE PAIEMENT SINGPAY (Airtel Money / Moov Money Gabon)
//
// Adapté du service réel et déjà testé en conditions réelles sur GHULABE
// (même passerelle SingPay, mêmes noms d'endpoints, confirmés via la
// documentation Swagger officielle client.singpay.ga) :
// - L'opérateur est choisi via l'ENDPOINT lui-même, pas via un champ dédié :
//     POST /v1/74/paiement  → Airtel Money
//     POST /v1/62/paiement  → Moov Money
// - Vérification de statut : GET /v1/transaction/api/status/{id}
// ============================================================================

const SINGPAY_ENDPOINT_AIRTEL = 'https://gateway.singpay.ga/v1/74/paiement'
const SINGPAY_ENDPOINT_MOOV = 'https://gateway.singpay.ga/v1/62/paiement'
const SINGPAY_STATUS_URL = 'https://gateway.singpay.ga/v1/transaction/api/status'
const SINGPAY_CLIENT_ID = process.env.SINGPAY_API_KEY
const SINGPAY_CLIENT_SECRET = process.env.SINGPAY_SECRET_KEY
const SINGPAY_WALLET_ID = process.env.SINGPAY_WALLET_ID
const PAYMENT_TIMEOUT_MS = 30000

export type MobileMoneyOperator = 'airtel' | 'moov'

export interface InitiatePaymentParams {
  amount: number // en FCFA (XAF)
  phoneNumber: string // client_msisdn
  operator: MobileMoneyOperator
  reference: string // référence interne (ex: subscription:<userId>:<plan>)
  description: string
  userId: string
  ip: string
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  status: 'pending' | 'success' | 'failed'
  message_fr: string
  message_en: string
  raw?: unknown
}

function isConfigured(): boolean {
  return Boolean(SINGPAY_CLIENT_ID && SINGPAY_CLIENT_SECRET && SINGPAY_WALLET_ID)
}

function endpointFor(operator: MobileMoneyOperator): string {
  return operator === 'airtel' ? SINGPAY_ENDPOINT_AIRTEL : SINGPAY_ENDPOINT_MOOV
}

/**
 * SingPay/Airtel exige le format international complet (indicatif 241, sans
 * le 0 initial) pour déclencher le push USSD réel. Le frontend ne collecte
 * que 8-9 chiffres locaux (ex: "077123456") : on ajoute l'indicatif ici.
 */
function toInternationalMsisdn(phoneNumber: string): string {
  let digits = phoneNumber.replace(/\D/g, '')
  if (digits.startsWith('241')) return digits
  if (digits.startsWith('0')) digits = digits.slice(1)
  return `241${digits}`
}

/**
 * Initie un paiement Mobile Money (Airtel Money ou Moov Money) via SingPay.
 */
export async function initiateMobileMoneyPayment(params: InitiatePaymentParams): Promise<PaymentResult> {
  const { amount, phoneNumber, operator, reference, userId } = params

  if (!isConfigured()) {
    logger.warn('Paiement bloqué : SINGPAY_API_KEY/SECRET_KEY/WALLET_ID absents des variables d\'environnement', {
      userId,
    })

    return {
      success: false,
      status: 'failed',
      message_fr: "Passerelle de paiement non configurée. Contactez l'administrateur.",
      message_en: 'Payment gateway not configured. Contact the administrator.',
    }
  }

  const endpoint = endpointFor(operator)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PAYMENT_TIMEOUT_MS)

  try {
    logger.info(`Paiement ${operator.toUpperCase()} initié : ${amount} FCFA (réf: ${reference})`, { userId })

    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': SINGPAY_CLIENT_ID as string,
        'x-client-secret': SINGPAY_CLIENT_SECRET as string,
        'x-wallet': SINGPAY_WALLET_ID as string,
      },
      body: JSON.stringify({
        amount,
        reference,
        client_msisdn: toInternationalMsisdn(phoneNumber),
        portefeuille: SINGPAY_WALLET_ID,
        isTransfer: false,
      }),
    })

    const data: any = await res.json().catch(() => null)

    if (!res.ok || !data) {
      logger.error(`Échec de l'initiation du paiement SingPay (HTTP ${res.status})`, { userId, data })

      return {
        success: false,
        status: 'failed',
        message_fr: 'Le paiement a échoué. Veuillez réessayer ou vérifier votre solde Mobile Money.',
        message_en: 'Payment failed. Please try again or check your Mobile Money balance.',
        raw: data,
      }
    }

    const tx = data.transaction || data
    const transactionId: string | undefined =
      tx?.id || data.transaction_id || data.id || data.reference || data.transactionId
    const status: PaymentResult['status'] =
      tx?.status === 'success' || tx?.status === 'SUCCESS' ? 'success' : 'pending'

    logger.info(
      `Paiement ${operator.toUpperCase()} en statut "${status}" (transactionId: ${transactionId}, raw: ${JSON.stringify(tx)})`,
      { userId }
    )

    return {
      success: true,
      transactionId,
      status,
      message_fr: 'Paiement initié. Validez la demande sur votre téléphone via le code envoyé.',
      message_en: 'Payment initiated. Confirm the request on your phone with the code sent.',
      raw: data,
    }
  } catch (err: any) {
    logger.error('Erreur technique lors de l\'appel SingPay', { userId, message: err.message })

    return {
      success: false,
      status: 'failed',
      message_fr: 'Erreur technique lors du paiement. Veuillez réessayer.',
      message_en: 'Technical error during payment. Please try again.',
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Vérifie le statut d'une transaction déjà initiée.
 */
export async function checkPaymentStatus(transactionId: string, userId: string): Promise<PaymentResult> {
  if (!isConfigured()) {
    return {
      success: false,
      status: 'failed',
      message_fr: 'Passerelle de paiement non configurée.',
      message_en: 'Payment gateway not configured.',
    }
  }

  try {
    const res = await fetch(`${SINGPAY_STATUS_URL}/${transactionId}`, {
      method: 'GET',
      headers: {
        'x-client-id': SINGPAY_CLIENT_ID as string,
        'x-client-secret': SINGPAY_CLIENT_SECRET as string,
        'x-wallet': SINGPAY_WALLET_ID as string,
      },
    })

    const rawText = await res.text()
    let data: any = null
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch {
      data = null
    }

    // Auparavant, un échec de parsing JSON produisait silencieusement
    // "raw: null" dans les logs sans jamais indiquer le code HTTP ni le
    // corps brut renvoyé par SingPay — impossible de savoir si c'était un
    // 404, un 401, un corps vide, ou autre chose. Confirmé le 25 août sur
    // trois vérifications consécutives d'une même transaction restée en
    // pending. Ce log expose enfin la vraie cause pour le prochain test.
    if (data === null) {
      logger.error(
        `Réponse SingPay illisible pour la vérification de statut (HTTP ${res.status} ${res.statusText})`,
        { userId, transactionId, rawTextSnippet: rawText.slice(0, 500) }
      )
    }

    const tx = data?.transaction || data
    const status: PaymentResult['status'] =
      tx?.status === 'success' ? 'success' : tx?.status === 'failed' ? 'failed' : 'pending'

    logger.info(
      `Statut vérifié pour transaction ${transactionId} : ${status} (HTTP ${res.status}, raw: ${JSON.stringify(tx)})`,
      { userId }
    )

    return {
      success: res.ok,
      transactionId,
      status,
      message_fr: `Statut du paiement : ${status}.`,
      message_en: `Payment status: ${status}.`,
      raw: data,
    }
  } catch (err: any) {
    logger.error('Impossible de vérifier le statut du paiement', { userId, transactionId, message: err.message })
    return {
      success: false,
      status: 'failed',
      message_fr: 'Impossible de vérifier le statut du paiement.',
      message_en: 'Unable to check payment status.',
    }
  }
}
