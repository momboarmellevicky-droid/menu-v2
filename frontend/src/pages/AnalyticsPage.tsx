import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, Zap, Code2, Users, Activity, Loader2 } from 'lucide-react'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import { api } from '../lib/api'
import { useCodeStore } from '../stores/codeStore'
import { Project } from '../types'

export default function AnalyticsPage() {
  const { history } = useCodeStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [credits, setCredits] = useState<{ credits: number } | null>(null)
  const [teamCount, setTeamCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getProjects().catch(() => []),
      api.getCredits().catch(() => null),
    ]).then(async ([projectsData, creditsData]) => {
      setProjects(projectsData)
      setCredits(creditsData)
      if (projectsData.length > 0) {
        try {
          const members = await api.getTeamMembers(projectsData[0].id)
          setTeamCount(Array.isArray(members) ? members.length : null)
        } catch {
          setTeamCount(null)
        }
      }
      setIsLoading(false)
    })
  }, [])

  const stats = [
    { icon: Code2, label: 'Projets créés', value: projects.length, suffix: '', color: 'text-primary' },
    { icon: Clock, label: 'Temps économisé (estimé)', value: history.length * 2, suffix: 'h', color: 'text-secondary' },
    { icon: Zap, label: 'Générations locales', value: history.length, suffix: '', color: 'text-yellow-400' },
    { icon: TrendingUp, label: 'Crédits restants', value: credits?.credits ?? 0, suffix: '', color: 'text-green-400' },
  ]

  const frameworkCounts = history.reduce<Record<string, number>>((acc, item) => {
    acc[item.framework] = (acc[item.framework] || 0) + 1
    return acc
  }, {})
  const maxCount = Math.max(1, ...Object.values(frameworkCounts))
  const featuresUsed = Object.entries(frameworkCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / maxCount) * 100),
  }))

  const creditsUsed = credits ? Math.max(0, 30 - credits.credits) : 0
  const creditsTotal = 30

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-6xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-1">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Analytics
            </span>
          </h1>
          <p className="text-text-muted">Suivez vos performances et l'utilisation de MÉNU.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-bg-card border border-border rounded-2xl p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                <stat.icon size={20} className={stat.color} />
              </div>
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-text-muted" />
              ) : (
                <AnimatedCounter end={stat.value} suffix={stat.suffix} label="" className="!text-left" />
              )}
              <div className="text-sm text-text-muted mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={20} className="text-primary" />
            <h2 className="font-semibold text-lg">Frameworks utilisés</h2>
          </div>

          {featuresUsed.length === 0 ? (
            <p className="text-text-muted text-sm">Aucune génération pour l'instant.</p>
          ) : (
            <div className="space-y-5">
              {featuresUsed.map((feature, i) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{feature.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted">{feature.count} génération{feature.count > 1 ? 's' : ''}</span>
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
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} className="text-yellow-400" />
              <h2 className="font-semibold">Crédits utilisés</h2>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">{creditsUsed}</span>
              <span className="text-text-muted mb-1">/ {creditsTotal}</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-primary rounded-full"
                style={{ width: `${Math.min(100, (creditsUsed / creditsTotal) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-secondary" />
              <h2 className="font-semibold">Équipe</h2>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">{teamCount ?? '—'}</span>
              <span className="text-text-muted mb-1">membre{(teamCount ?? 0) !== 1 ? 's' : ''}</span>
            </div>
            {projects.length === 0 && (
              <p className="text-xs text-text-muted mt-2">Créez un projet pour inviter votre équipe.</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
              }
