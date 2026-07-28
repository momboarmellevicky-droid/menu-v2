import { motion } from 'framer-motion'
import { LayoutDashboard, Code2, Zap, TrendingUp, Clock, FolderOpen } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useCodeStore } from '../stores/codeStore'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import MemoryBadge from '../components/ui/MemoryBadge'

const quickActions = [
  { icon: Code2, label: 'Nouveau projet', href: '/generate', color: 'from-primary to-secondary' },
  { icon: FolderOpen, label: 'Mes projets', href: '#', color: 'from-secondary to-primary' },
  { icon: Zap, label: 'Crédits', href: '#', color: 'from-primary to-secondary' },
  { icon: TrendingUp, label: 'Analytics', href: '/analytics', color: 'from-secondary to-primary' },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { history } = useCodeStore()

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-7xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Bonjour, <span className="text-primary">{user?.name || 'Développeur'}</span> 👋
            </h1>
            <p className="text-text-muted">Voici votre tableau de bord MÉNU.</p>
          </div>
          <MemoryBadge memoryCount={history.length} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="text-text-muted text-sm mb-2">Projets créés</div>
            <AnimatedCounter end={history.length} label="" className="!text-left" />
          </div>
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="text-text-muted text-sm mb-2">Code généré</div>
            <AnimatedCounter end={history.length * 150} suffix=" lignes" label="" className="!text-left" />
          </div>
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="text-text-muted text-sm mb-2">Temps économisé</div>
            <AnimatedCounter end={history.length * 2} suffix="h" label="" className="!text-left" />
          </div>
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="text-text-muted text-sm mb-2">Crédits restants</div>
            <AnimatedCounter end={user?.credits || 30} label="" className="!text-left" />
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {quickActions.map((action, i) => (
            <motion.a
              key={i}
              href={action.href}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon size={20} className="text-white" />
              </div>
              <span className="font-medium text-sm">{action.label}</span>
            </motion.a>
          ))}
        </div>

        {/* Recent Activity */}
        <h2 className="text-xl font-semibold mb-4">Activité récente</h2>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p>Aucune activité récente. Commencez par générer du code !</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Code2 size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-md">{item.prompt}</p>
                      <p className="text-xs text-text-muted">{item.language.toUpperCase()} • {new Date(item.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                    Terminé
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}