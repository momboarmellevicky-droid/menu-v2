import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Star, Download, Filter, LayoutDashboard, ShoppingCart, FileText, Users, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { MarketplaceItem } from '../types'
import { useCodeStore } from '../stores/codeStore'

const categories = [
  { id: 'all', label: 'Tous', icon: Filter },
  { id: 'dashboard', label: 'Dashboards', icon: LayoutDashboard },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { id: 'form', label: 'Formulaires', icon: FileText },
  { id: 'crm', label: 'CRM', icon: Users },
]

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { setCurrentCode } = useCodeStore()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    api.getMarketplaceItems(activeCategory === 'all' ? undefined : activeCategory, search || undefined)
      .then(setItems)
      .catch(() => setError('Impossible de charger le marketplace'))
      .finally(() => setIsLoading(false))
  }, [activeCategory, search])

  const handleUse = async (item: MarketplaceItem) => {
    setDownloadingId(item.id)
    setError(null)
    try {
      const result = await api.downloadMarketplaceItem(item.id)
      setCurrentCode({
        id: item.id,
        prompt: item.title,
        code: result.code,
        language: 'tsx',
        framework: 'react',
        createdAt: new Date(),
      })
      navigate('/generate')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du téléchargement')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-7xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Marketplace
            </span>
          </h1>
          <p className="text-text-muted max-w-xl mx-auto">
            Bibliothèque communautaire de composants, templates et modèles métiers prêts à l'emploi.
          </p>
        </div>

        {error && (
          <div className="mb-8 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un template..."
              className="w-full bg-bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-white placeholder-text-muted outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-bg-card text-text-muted border border-border hover:border-primary/30'
              }`}
            >
              <cat.icon size={16} />
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-text-muted">
            <Loader2 size={28} className="mx-auto mb-3 animate-spin" />
            Chargement...
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-text-muted">
            <p>Aucun template trouvé.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                    <LayoutDashboard size={24} className="text-primary" />
                  </div>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg border border-green-500/20">
                    {item.price > 0 ? `${item.price} crédits` : 'Gratuit'}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-text-muted text-sm mb-4">{item.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400" />
                      {item.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download size={14} />
                      {item.downloads}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUse(item)}
                    disabled={downloadingId === item.id}
                    className="px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {downloadingId === item.id && <Loader2 size={14} className="animate-spin" />}
                    Utiliser
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
