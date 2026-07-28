import { motion } from 'framer-motion'
import { TrendingUp, Clock, Zap, Code2, Bug, Users, BarChart3, Activity } from 'lucide-react'
import AnimatedCounter from '../components/ui/AnimatedCounter'

const stats = [
  { icon: Code2, label: 'Projets créés', value: 47, suffix: '', color: 'text-primary' },
  { icon: Clock, label: 'Temps économisé', value: 94, suffix: 'h', color: 'text-secondary' },
  { icon: Bug, label: 'Erreurs corrigées', value: 128, suffix: '', color: 'text-green-400' },
  { icon: Zap, label: 'Requêtes API', value: 2340, suffix: '', color: 'text-yellow-400' },
]

const featuresUsed = [
  { name: 'Génération Frontend', count: 156, percentage: 85 },
  { name: 'Génération Full Stack', count: 89, percentage: 62 },
  { name: 'Voice Creator', count: 34, percentage: 28 },
  { name: 'Marketplace', count: 67, percentage: 45 },
  { name: 'Déploiement', count: 42, percentage: 38 },
  { name: 'Collaboration', count: 23, percentage: 18 },
]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-6xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-1">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Analytics
            </span>
          </h1>
          <p className="text-text-muted">Suivez vos performances et l'utilisation de MÉNU.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-bg-card border border-border rounded-2xl p-6"
            >
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <AnimatedCounter end={stat.value} suffix={stat.suffix} label="" className="!text-left" />
              <div className="text-sm text-text-muted mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Features usage */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={20} className="text-primary" />
            <h2 className="font-semibold text-lg">Utilisation des fonctionnalités</h2>
          </div>

          <div className="space-y-5">
            {featuresUsed.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{feature.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted">{feature.count} utilisations</span>
                    <span className="text-xs font-mono text-primary">{feature.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${feature.percentage}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Credits */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-yellow-400" />
              <h2 className="font-semibold">Crédits utilisés ce mois</h2>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">1,247</span>
              <span className="text-text-muted mb-1">/ 2,500</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full w-[50%] bg-gradient-to-r from-yellow-400 to-primary rounded-full" />
            </div>
            <p className="text-xs text-text-muted mt-2">50% utilisés — Renouvellement dans 12 jours</p>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-secondary" />
              <h2 className="font-semibold">Équipe</h2>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">3</span>
              <span className="text-text-muted mb-1">/ 5 membres</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full w-[60%] bg-gradient-to-r from-secondary to-primary rounded-full" />
            </div>
            <p className="text-xs text-text-muted mt-2">2 places disponibles sur votre plan Pro</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}