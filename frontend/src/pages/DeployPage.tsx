import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Smartphone, Rocket, Check, Loader2, ExternalLink, Copy, CheckCheck } from 'lucide-react'

interface DeployTarget {
  id: string
  platform: 'web' | 'pwa' | 'android' | 'ios'
  name: string
  icon: typeof Globe
  status: 'ready' | 'building' | 'deployed' | 'error'
  url?: string
}

const deployTargets: DeployTarget[] = [
  { id: '1', platform: 'web', name: 'Site Web', icon: Globe, status: 'ready' },
  { id: '2', platform: 'pwa', name: 'PWA', icon: Globe, status: 'ready' },
  { id: '3', platform: 'android', name: 'Android', icon: Smartphone, status: 'ready' },
  { id: '4', platform: 'ios', name: 'iOS', icon: Smartphone, status: 'ready' },
]

export default function DeployPage() {
  const [targets, setTargets] = useState<DeployTarget[]>(deployTargets)
  const [copied, setCopied] = useState<string | null>(null)

  const handleDeploy = async (targetId: string) => {
    setTargets(prev => prev.map(t => 
      t.id === targetId ? { ...t, status: 'building' as const } : t
    ))

    // Simulation
    await new Promise(r => setTimeout(r, 3000))

    setTargets(prev => prev.map(t => 
      t.id === targetId ? { 
        ...t, 
        status: 'deployed' as const, 
        url: `https://${t.platform}-demo.menu.app/${Math.random().toString(36).substring(7)}` 
      } : t
    ))
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
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    target.status === 'deployed' ? 'bg-green-500/10' : 'bg-primary/10'
                  }`}>
                    <target.icon size={24} className={
                      target.status === 'deployed' ? 'text-green-400' : 'text-primary'
                    } />
                  </div>
                  <div>
                    <h3 className="font-semibold">{target.name}</h3>
                    <span className={`text-xs ${
                      target.status === 'deployed' ? 'text-green-400' :
                      target.status === 'building' ? 'text-primary' :
                      'text-text-muted'
                    }`}>
                      {target.status === 'ready' && 'Prêt à déployer'}
                      {target.status === 'building' && 'Déploiement en cours...'}
                      {target.status === 'deployed' && 'Déployé'}
                    </span>
                  </div>
                </div>

                {target.status === 'deployed' && (
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check size={14} className="text-green-400" />
                  </div>
                )}
              </div>

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
                onClick={() => handleDeploy(target.id)}
                disabled={target.status === 'building' || target.status === 'deployed'}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  target.status === 'deployed'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                    : target.status === 'building'
                    ? 'bg-primary/10 text-primary cursor-wait'
                    : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]'
                }`}
              >
                {target.status === 'building' && <Loader2 size={16} className="animate-spin" />}
                {target.status === 'ready' && <Rocket size={16} />}
                {target.status === 'deployed' && <Check size={16} />}
                {target.status === 'ready' && 'Déployer'}
                {target.status === 'building' && 'Déploiement...'}
                {target.status === 'deployed' && 'Déployé'}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}