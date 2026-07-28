import { motion } from 'framer-motion'
import { MessageSquare, Brain, Code2, Rocket } from 'lucide-react'

const steps = [
  { icon: MessageSquare, title: 'Décrivez', description: 'Expliquez votre idée en langage naturel, par texte ou par la voix.', color: 'from-secondary to-primary' },
  { icon: Brain, title: 'Analyse IA', description: 'Nos 6 agents IA analysent, architectent et designent votre application.', color: 'from-primary to-secondary' },
  { icon: Code2, title: 'Générez', description: 'Le code React/TypeScript Full Stack est produit, testé et optimisé.', color: 'from-secondary to-primary' },
  { icon: Rocket, title: 'Déployez', description: "Publiez en un clic sur Web, PWA, Android ou iOS.", color: 'from-primary to-secondary' },
]

export default function HowItWorksSection() {
  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Comment ça marche
            </span>
          </h2>
          <p className="text-text-muted text-lg">
            De la description à l'application déployée en 4 étapes simples.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Ligne de connexion */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-secondary via-primary to-secondary opacity-30" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {/* Numéro */}
              <div className="w-10 h-10 rounded-full bg-bg-card border-2 border-primary flex items-center justify-center text-primary font-bold text-sm z-10 relative mx-auto mb-6">
                {i + 1}
              </div>

              <div className="text-center">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-5`}>
                  <step.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-text-muted leading-relaxed text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}