import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-3xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Politique de Confidentialité</h1>
            <p className="text-sm text-text-muted">Dernière mise à jour : 2 août 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-text-muted">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Données collectées</h2>
            <p>MÉNU collecte les données suivantes dans le cadre de l'utilisation du service :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Données de compte : adresse e-mail, nom, mot de passe (chiffré)</li>
              <li>Contenu généré : les prompts saisis et le code produit par les agents IA</li>
              <li>Données techniques : adresse IP, type de navigateur, journaux d'erreurs</li>
              <li>Données d'usage : nombre de générations, crédits consommés, projets créés</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Finalité du traitement</h2>
            <p>Les données sont utilisées exclusivement pour :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Fournir et améliorer le service de génération de code</li>
              <li>Gérer l'authentification et la sécurité du compte</li>
              <li>Gérer la facturation et les crédits</li>
              <li>Assurer le support technique</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Partage des données avec des tiers</h2>
            <p>
              Les prompts et le code à générer sont transmis à des fournisseurs d'intelligence
              artificielle tiers (Anthropic, Groq, Google) dans le seul but de produire le
              résultat demandé par l'utilisateur. Ces fournisseurs traitent ces données selon
              leurs propres politiques de confidentialité respectives. MÉNU ne vend et ne loue
              aucune donnée personnelle à des tiers à des fins commerciales ou publicitaires.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Hébergement et stockage</h2>
            <p>
              Les données de compte et les projets générés sont stockés via Supabase
              (infrastructure PostgreSQL sécurisée). Le backend applicatif est hébergé sur
              Render. Les applications déployées par l'utilisateur via la fonctionnalité de
              déploiement sont hébergées sur Vercel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Durée de conservation</h2>
            <p>
              Les données de compte sont conservées tant que le compte est actif. En cas de
              suppression du compte, les données personnelles sont supprimées dans un délai
              raisonnable, sous réserve des obligations légales de conservation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Droits de l'utilisateur</h2>
            <p>
              Conformément aux réglementations applicables en matière de protection des données,
              l'utilisateur dispose d'un droit d'accès, de rectification, de suppression et de
              portabilité de ses données personnelles. Ces droits peuvent être exercés en
              contactant l'éditrice du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Cookies</h2>
            <p>
              MÉNU utilise des cookies strictement nécessaires au fonctionnement du service
              (maintien de la session utilisateur, authentification). Aucun cookie publicitaire
              ou de traçage tiers n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Contact</h2>
            <p>
              Pour toute question relative à cette politique de confidentialité ou pour exercer
              vos droits, contactez l'éditrice du service, MOMBO ARMELLE VICKY.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  )
      }
