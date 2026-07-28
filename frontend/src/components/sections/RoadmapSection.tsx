import { motion } from 'framer-motion'
import { Check, Clock, Circle } from 'lucide-react'

const phases = [
  {
    phase: 'Phase 1',
    period: '1-3 mois',
    status: 'in-progress',
    items: ['Multi-agents IA', 'Correction auto du code', 'Mémoire projet', 'Génération Full Stack', 'Déploiement automatique'],
  },
  {
    phase: 'Phase 2',
    period: '3-6 mois',
    status: 'planned',
    items: ['Voice Creator', 'Marketplace', 'Mobile Builder', 'Connecteurs business'],
  },
  {
    phase: 'Phase 3',
    period: '6-18 mois',
    status: 'planned',
    items: ['MÉNU Academy', 'Système de crédits', 'Analytics avancés', 'Marketplace mondiale'],
  },
]

const statusConfig = {
  'in-progress': { icon: Clock, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  'planned': { icon: Circle, color: 'text-text-muted', bg: 'bg-white/5', border: 'border-border' },
  'completed': { icon: Check, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
}

export default function RoadmapSection() {
  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Feuille de route
            </span>
          </h2>
          <p className="text-text-muted text-lg">
            L'évolution de MÉNU vers un ingénieur numérique complet.
          </p>
        </motion.div>

        <div className="space-y-6">
          {phases.map((phase, i) => {
            const config = statusConfig[phase.status as keyof typeof statusConfig]
            const Icon = config.icon

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`bg-bg-card/50 backdrop-blur-sm border ${config.border} rounded-2xl p-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                    <Icon size={20} className={config.color} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{phase.phase}</h3>
                    <span className="text-sm text-text-muted">{phase.period}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {phase.items.map((item, j) => (
                    <span
                      key={j}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        phase.status === 'in-progress'
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-white/5 text-text-muted border border-border'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}