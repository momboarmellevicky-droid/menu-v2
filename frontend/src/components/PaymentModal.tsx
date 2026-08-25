import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { api, ApiError } from '../lib/api'

interface PaymentModalProps {
  plan: 'pro' | 'team'
  planLabel: string
  priceFcfa: number
  onClose: () => void
  onSuccess: () => void
}

type Step = 'form' | 'pending' | 'success' | 'failed'

export default function PaymentModal({ plan, planLabel, priceFcfa, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<'mobile_money' | 'card'>('mobile_money')
  const [operator, setOperator] = useState<'airtel' | 'moov'>('airtel')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage('')

    if (method === 'card') {
      handleCardCheckout()
      return
    }

    if (!/^\d{8,9}$/.test(phoneNumber.replace(/\s/g, ''))) {
      setErrorMessage('Numéro de téléphone invalide (8 à 9 chiffres, sans indicatif).')
      return
    }

    setStep('pending')

    try {
      const result = await api.startSubscriptionPayment(plan, phoneNumber.replace(/\s/g, ''), operator)

      if (result.status === 'success') {
        setStep('success')
        return
      }
      if (result.status === 'failed') {
        setErrorMessage(result.message_fr)
        setStep('failed')
        return
      }

      // status === 'pending' : on interroge le statut jusqu'à confirmation
      // ou expiration (l'utilisateur valide sur son téléphone entre-temps).
      pollStatus(result.reference)
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors du paiement.')
      setStep('failed')
    }
  }

  async function handleCardCheckout() {
    setStep('pending')
    try {
      // Redirection vers la page de paiement sécurisée Stripe (hébergée par
      // Stripe : notre serveur ne voit jamais le numéro de carte). Le
      // retour se fait sur cette même page, avec ?stripe_session_id=...
      const result = await api.startStripeCheckout(plan)
      window.location.href = result.url
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la création du paiement par carte.')
      setStep('failed')
    }
  }

  function pollStatus(reference: string) {
    let attempts = 0
    const maxAttempts = 20 // ~2 minutes (6s d'intervalle)

    const interval = setInterval(async () => {
      attempts += 1
      try {
        const result = await api.getSubscriptionPaymentStatus(reference)
        if (result.status === 'success') {
          clearInterval(interval)
          setStep('success')
        } else if (result.status === 'failed') {
          clearInterval(interval)
          setErrorMessage(result.message_fr)
          setStep('failed')
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setErrorMessage(
            "Le paiement n'a pas été confirmé à temps. Vérifiez votre téléphone puis rechargez la page."
          )
          setStep('failed')
        }
      } catch {
        // erreur réseau ponctuelle : on continue d'essayer jusqu'à maxAttempts
      }
    }, 6000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={step === 'form' ? onClose : undefined}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="bg-bg-card border border-border rounded-2xl w-full max-w-sm p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {step === 'form' && (
            <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white">
              <X size={20} />
            </button>
          )}

          {step === 'form' && (
            <>
              <h2 className="text-lg font-semibold mb-1">Passer au plan {planLabel}</h2>
              <p className="text-sm text-text-muted mb-6">
                {method === 'mobile_money'
                  ? `${priceFcfa.toLocaleString('fr-FR')} FCFA / mois, via Mobile Money`
                  : 'Paiement par carte bancaire, en dollars (tous pays)'}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setMethod('mobile_money')}
                  className={`py-2.5 rounded-xl text-sm font-medium border ${
                    method === 'mobile_money' ? 'border-primary bg-primary/10 text-white' : 'border-border text-text-muted'
                  }`}
                >
                  Mobile Money
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`py-2.5 rounded-xl text-sm font-medium border ${
                    method === 'card' ? 'border-primary bg-primary/10 text-white' : 'border-border text-text-muted'
                  }`}
                >
                  Carte bancaire
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {method === 'mobile_money' && (
                  <>
                    <div>
                      <label className="text-sm text-text-muted mb-2 block">Opérateur</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOperator('airtel')}
                          className={`py-2.5 rounded-xl text-sm font-medium border ${
                            operator === 'airtel' ? 'border-primary bg-primary/10 text-white' : 'border-border text-text-muted'
                          }`}
                        >
                          Airtel Money
                        </button>
                        <button
                          type="button"
                          onClick={() => setOperator('moov')}
                          className={`py-2.5 rounded-xl text-sm font-medium border ${
                            operator === 'moov' ? 'border-primary bg-primary/10 text-white' : 'border-border text-text-muted'
                          }`}
                        >
                          Moov Money
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-text-muted mb-2 block">Numéro de téléphone</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ex: 077123456"
                        className="w-full bg-black/20 border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}

                {method === 'card' && (
                  <p className="text-sm text-text-muted">
                    Vous allez être redirigé vers une page de paiement sécurisée pour entrer les
                    informations de votre carte. Aucune donnée bancaire ne transite par MÉNU.
                  </p>
                )}

                {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                >
                  {method === 'mobile_money'
                    ? `Payer ${priceFcfa.toLocaleString('fr-FR')} FCFA`
                    : 'Continuer vers le paiement par carte'}
                </button>
              </form>
            </>
          )}

          {step === 'pending' && method === 'mobile_money' && (
            <div className="flex flex-col items-center text-center py-6">
              <Loader2 size={40} className="animate-spin text-primary mb-4" />
              <h2 className="text-lg font-semibold mb-2">Confirmez sur votre téléphone</h2>
              <p className="text-sm text-text-muted">
                Une demande de paiement a été envoyée à votre numéro {operator === 'airtel' ? 'Airtel Money' : 'Moov Money'}.
                Validez-la pour activer votre plan.
              </p>
            </div>
          )}

          {step === 'pending' && method === 'card' && (
            <div className="flex flex-col items-center text-center py-6">
              <Loader2 size={40} className="animate-spin text-primary mb-4" />
              <h2 className="text-lg font-semibold mb-2">Redirection vers le paiement...</h2>
              <p className="text-sm text-text-muted">Un instant, on vous emmène vers la page sécurisée.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 size={40} className="text-green-400 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Plan {planLabel} activé</h2>
              <p className="text-sm text-text-muted mb-6">Vos crédits ont été mis à jour.</p>
              <button
                onClick={onSuccess}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
              >
                Continuer
              </button>
            </div>
          )}

          {step === 'failed' && (
            <div className="flex flex-col items-center text-center py-6">
              <XCircle size={40} className="text-red-400 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Paiement non confirmé</h2>
              <p className="text-sm text-text-muted mb-6">{errorMessage}</p>
              <button
                onClick={() => setStep('form')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-white hover:bg-white/10 border border-border"
              >
                Réessayer
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
