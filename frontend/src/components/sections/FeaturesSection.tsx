import { motion } from 'framer-motion'
import { Code2, Layers, Brain, Wrench, Store, Users, Rocket, Smartphone, Mic } from 'lucide-react'
import FeatureCard from '../ui/FeatureCard'

const features = [
  { icon: Code2, title: 'Multi-Agents IA', description: '6 agents spécialisés analysent, architectent, designent, codent, testent et optimisent votre application.' },
  { icon: Layers, title: 'Full Stack Generator', description: 'Générez frontend, backend, base de données, API et authentification en une seule commande.' },
  { icon: Brain, title: 'MÉNU Memory Engine', description: "L'IA conserve le contexte complet de votre projet : architecture, historique, préférences." },
  { icon: Wrench, title: 'AI Code Repair', description: 'Détection et correction automatique des erreurs en temps réel pendant la génération.' },
  { icon: Store, title: 'Marketplace', description: 'Bibliothèque communautaire de composants, dashboards, CRM et modèles métiers prêts à emploi.' },
  { icon: Users, title: 'MÉNU Team', description: 'Collaboration en temps réel : partage de projets, commentaires, rôles et permissions.' },
  { icon: Rocket, title: 'One Click Deploy', description: 'Déploiement instantané sur Web, PWA, Android et iOS depuis un seul bouton.' },
  { icon: Smartphone, title: 'Mobile Builder', description: 'Générez des applications mobiles natives avec React Native et Expo.' },
  { icon: Mic, title: 'Voice Creator', description: "Créez des applications entières rien qu'en parlant. L'IA comprend et construit." },
]

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Fonctionnalités
            </span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Une suite complète pour transformer n'importe quelle idée en produit numériel.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}