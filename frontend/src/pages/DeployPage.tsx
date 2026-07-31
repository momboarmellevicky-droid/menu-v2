import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Smartphone, Rocket, Check, Loader2, ExternalLink, Copy, CheckCheck, AlertTriangle } from 'lucide-react'
import { api } from '../lib/api'
import { useProjectStore } from '../stores/projectStore'
import { useCodeStore } from '../stores/codeStore'

interface DeployTarget {
  id: string
  platform: 'web' | 'pwa' | 'android' | 'ios'
  name: string
  icon: typeof Globe
  status: 'ready' | 'building' | 'deployed' | 'error'
  url?: string
  errorMsg?: string
}

const initialTargets: DeployTarget[] = [
  { id: '1', platform: 'web', name: 'Site Web', icon: Globe, status: 'ready' },
  { id: '2', platform: 'pwa', name: 'PWA', icon: Globe, status: 'ready' },
  { id: '3', platform: 'android', name: 'Android', icon: Smartphone, status: 'ready' },
  { id: '4', platform: 'ios', name: 'iOS', icon: Smartphone, status: 'ready' },
]

export default function DeployPage() {
  const [targets, setTargets] = useState<DeployTarget[]>(initialTargets)
  const [copied, setCopied] = useState<string | null>(null)
  const { currentProject } = useProjectStore()
  const { currentCode } = useCodeStore()

  // Le projet à déployer : celui sélectionné explicitement, sinon celui du
  // dernier code généré (généré via Full Stack, qui crée toujours un projet réel).
  const activeProjectId = currentProject?.id || currentCode?.projectId

  const handleDeploy = async (targetId: string, platform: DeployTarget['platform']) => {
    if (!activeProjectId) {
      setTargets(prev => prev.map(t =>
        t.id === targetId
          ? { ...t, status: 'error', errorMsg: 'Aucun projet actif. Générez du code en mode Full Stack d\'abord.' }
          : t
      ))
      return
    }

    setTargets(prev => prev.map(t =>
      t.id === targetId ? { ...t, status: 'building', errorMsg: undefined } : t
    ))

    try {
      // Appel réel au backend (déploiement Vercel effectif pour web/pwa,
      // erreur explicite pour android/ios tant qu'Expo/EAS n'est pas configuré).
      const result = await api.deploy(activeProjectId, platform) as { url?: string; status: string }

      if (result.status === 'error' || !result.url) {
        throw new Error('Déploiement échoué côté serveur.')
      }

      setTargets(prev => prev.map(t =>
        t.id === targetId ? { ...t, status: 'deployed', url: result.url } : t
      ))
    } catch (err) {
      setTargets(prev => prev.map(t =>
        t.id === targetId
          ? { ...t, status: 'error', errorMsg: err instanceof Error ? err.message : 'Erreur de déploiement.' }
          : t
      ))
    }
  }

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-4xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              One Click Deploy
            </span>
          </h1>
          <p className="text-text-muted max-w-xl mx-auto">
            Déployez votre application sur n'importe quelle plateforme en un seul clic.
          </p>
          {!activeProjectId && (
            <p className="text-xs text-yellow-400 mt-3 flex items-center justify-center gap-1.5">
              <AlertTriangle size={12} />
              Aucun projet actif — générez du code en mode Full Stack avant de déployer.
            </p>
          )}
        </div>

        {/* Deploy targets */}
        <div className="grid md:grid-cols-2 gap-6">
          {targets.map((target, i) => (
            <motion.div
              key={target.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-bg-card border rounded-2xl p-6 transition-all ${
                target.status === 'deployed'
                  ? 'border-green-500/30'
                  : target.status === 'building'
                  ? 'border-primary/30'
                  : target.status === 'error'
                  ? 'border-red-500/40'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    target.status === 'deployed' ? 'bg-green-500/10' :
                    target.status === 'error' ? 'bg-red-500/10' : 'bg-primary/10'
                  }`}>
                    <target.icon size={24} className={
                      target.status === 'deployed' ? 'text-green-400' :
                      target.status === 'error' ? 'text-red-400' : 'text-primary'
                    } />
                  </div>
                  <div>
                    <h3 className="font-semibold">{target.name}</h3>
                    <span className={`text-xs ${
                      target.status === 'deployed' ? 'text-green-400' :
                      target.status === 'building' ? 'text-primary' :
                      target.status === 'error' ? 'text-red-400' :
                      'text-text-muted'
                    }`}>
                      {target.status === 'ready' && 'Prêt à déployer'}
                      {target.status === 'building' && 'Déploiement en cours...'}
                      {target.status === 'deployed' && 'Déployé'}
                      {target.status === 'error' && 'Échec du déploiement'}
                    </span>
                  </div>
                </div>

                {target.status === 'deployed' && (
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check size={14} className="text-green-400" />
                  </div>
                )}
              </div>

              {target.status === 'error' && target.errorMsg && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                  {target.errorMsg}
                </div>
              )}

              {target.url && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-bg rounded-xl">
                  <input
                    type="text"
                    value={target.url}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-text-muted outline-none"
                  />
                  <button
                    onClick={() => handleCopy(target.url!, target.id)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {copied === target.id ? <CheckCheck size={16} className="text-green-400" /> : <Copy size={16} className="text-text-muted" />}
                  </button>
                  <a
                    href={target.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} className="text-text-muted" />
                  </a>
                </div>
              )}

              <button
                onClick={() => handleDeploy(target.id, target.platform)}
                disabled={target.status === 'building' || target.status === 'deployed'}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  target.status === 'deployed'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                    : target.status === 'building'
                    ? 'bg-primary/10 text-primary cursor-wait'
                    : target.status === 'error'
                    ? 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20'
                    : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]'
                }`}
              >
                {target.status === 'building' && <Loader2 size={16} className="animate-spin" />}
                {target.status === 'ready' && <Rocket size={16} />}
                {target.status === 'deployed' && <Check size={16} />}
                {target.status === 'error' && <Rocket size={16} />}
                {target.status === 'ready' && 'Déployer'}
                {target.status === 'building' && 'Déploiement...'}
                {target.status === 'deployed' && 'Déployé'}
                {target.status === 'error' && 'Réessayer'}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
