import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-3xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Conditions Générales d'Utilisation</h1>
            <p className="text-sm text-text-muted">Dernière mise à jour : 2 août 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-text-muted">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Objet</h2>
            <p>
              MÉNU est une plateforme de génération d'applications assistée par intelligence
              artificielle, éditée par MOMBO ARMELLE VICKY. Les présentes conditions générales
              d'utilisation (« CGU ») régissent l'accès et l'utilisation du service MÉNU,
              accessible via le web et, à terme, via des applications mobiles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Acceptation des conditions</h2>
            <p>
              En créant un compte ou en utilisant MÉNU, vous acceptez sans réserve les présentes
              CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Description du service</h2>
            <p>
              MÉNU permet à un utilisateur de générer du code applicatif (frontend, full stack)
              à partir d'une description en langage naturel, grâce à un ensemble d'agents
              d'intelligence artificielle. Le service peut également proposer un aperçu du code
              généré et un déploiement automatisé vers des plateformes tierces.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Compte utilisateur</h2>
            <p>
              L'utilisateur est responsable de la confidentialité de ses identifiants de
              connexion et de toute activité réalisée depuis son compte. Toute utilisation
              frauduleuse ou non autorisée doit être signalée sans délai.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Crédits et utilisation</h2>
            <p>
              L'accès à la génération de code est soumis à un système de crédits. Le nombre de
              crédits consommés dépend de la complexité de la demande (génération frontend,
              full stack, mobile). Les modalités précises des offres payantes sont détaillées
              sur la page Tarifs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Propriété du code généré</h2>
            <p>
              Sous réserve du paiement des sommes dues, l'utilisateur dispose d'un droit
              d'utilisation, de modification et d'exploitation commerciale du code généré via
              MÉNU pour ses propres projets. MÉNU ne revendique aucune propriété sur les
              applications finales créées par l'utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Limites de responsabilité</h2>
            <p>
              Le code généré par intelligence artificielle peut contenir des erreurs, malgré les
              mécanismes automatiques de détection et de correction mis en place. Il appartient
              à l'utilisateur de vérifier et de tester le code avant toute mise en production ou
              usage commercial. MÉNU ne saurait être tenu responsable des conséquences d'une
              utilisation du code généré sans vérification préalable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Résiliation</h2>
            <p>
              L'utilisateur peut supprimer son compte à tout moment. MÉNU se réserve le droit de
              suspendre ou résilier un compte en cas de violation des présentes CGU, notamment en
              cas d'usage abusif du service ou de génération de contenu illicite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Modification des CGU</h2>
            <p>
              MÉNU se réserve le droit de modifier les présentes CGU à tout moment. Les
              utilisateurs seront informés de toute modification substantielle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Contact</h2>
            <p>
              Pour toute question relative aux présentes conditions, contactez l'éditrice du
              service, MOMBO ARMELLE VICKY.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  )
}
