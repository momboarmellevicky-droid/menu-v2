import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

const plans = [
  {
    name: 'Gratuit',
    priceUsd: 0,
    tagline: 'Pour découvrir MÉNU',
    credits: '30 crédits offerts',
    features: [
      'Génération Frontend (1 crédit)',
      'Aperçu en direct du code',
      '1 déploiement web actif',
      'Historique local des générations',
    ],
    cta: 'Plan actuel',
    highlighted: false,
  },
  {
    name: 'Pro',
    priceUsd: 19,
    tagline: 'Pour un usage régulier',
    credits: '300 crédits / mois',
    features: [
      'Génération Frontend et Full Stack',
      'Projets multi-fichiers illimités',
      'Déploiements web illimités',
      'Support prioritaire',
    ],
    cta: 'Passer en Pro',
    highlighted: true,
  },
  {
    name: 'Équipe',
    priceUsd: 49,
    tagline: 'Pour collaborer à plusieurs',
    credits: '1000 crédits / mois partagés',
    features: [
      'Tout le contenu du plan Pro',
      "Jusqu'à 5 membres d'équipe",
      'Gestion des rôles par projet',
      'Marketplace de templates privée',
    ],
    cta: "Contacter pour l'équipe",
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-5xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Tarifs
            </span>
          </h1>
          <p className="text-text-muted max-w-xl mx-auto">
            Prix affichés en dollars américains (USD), la devise de référence de MÉNU. Un
            équivalent en FCFA et en euros est indiqué à titre indicatif.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border relative ${
                plan.highlighted
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-bg-card'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  <Sparkles size={12} />
                  Populaire
                </span>
              )}
              <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
              <p className="text-sm text-text-muted mb-4">{plan.tagline}</p>
              <div className="mb-1">
                <span className="text-3xl font-bold">${plan.priceUsd}</span>
                <span className="text-text-muted text-sm"> / mois</span>
              </div>
              <p className="text-xs text-text-muted mb-6">
                ≈ {(plan.priceUsd * 610).toLocaleString('fr-FR')} FCFA · ≈ {(plan.priceUsd * 0.92).toFixed(0)} €
              </p>
              <p className="text-sm font-medium text-primary mb-4">{plan.credits}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-muted">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.highlighted || plan.name === 'Équipe' ? (
                <a
                  href={`mailto:contact@menu-app.com?subject=${encodeURIComponent(`Demande d'accès au plan ${plan.name}`)}`}
                  className={`block text-center w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-border'
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-text-muted border border-border cursor-default"
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-muted mt-10">
          Les taux de conversion FCFA/EUR affichés sont indicatifs et peuvent varier. Le
          paiement en ligne sera bientôt disponible directement depuis cette page.
        </p>
      </motion.div>
    </div>
  )
}
