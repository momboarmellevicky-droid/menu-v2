import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Star, Download, Filter, LayoutDashboard, ShoppingCart, FileText, Users } from 'lucide-react'

const categories = [
  { id: 'all', label: 'Tous', icon: Filter },
  { id: 'dashboard', label: 'Dashboards', icon: LayoutDashboard },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { id: 'form', label: 'Formulaires', icon: FileText },
  { id: 'crm', label: 'CRM', icon: Users },
]

const items = [
  { id: '1', title: 'Dashboard Analytics', description: 'Tableau de bord complet avec graphiques et KPIs', category: 'dashboard', author: 'MÉNU Team', rating: 4.9, downloads: 2340, price: 0, tags: ['React', 'Charts', 'Tailwind'] },
  { id: '2', title: 'Boutique en ligne', description: 'Template e-commerce avec panier et paiement', category: 'ecommerce', author: 'Community', rating: 4.7, downloads: 1890, price: 0, tags: ['Next.js', 'Stripe', 'Prisma'] },
  { id: '3', title: 'CRM Pro', description: 'Gestion clients avec pipeline et tâches', category: 'crm', author: 'MÉNU Team', rating: 4.8, downloads: 1560, price: 0, tags: ['React', 'Node.js', 'MongoDB'] },
  { id: '4', title: 'Formulaire multi-étapes', description: 'Wizard form avec validation et progression', category: 'form', author: 'Community', rating: 4.6, downloads: 3200, price: 0, tags: ['React Hook Form', 'Zod', 'Framer'] },
  { id: '5', title: 'Admin Panel', description: "Panneau d'administration avec tables et CRUD", category: 'dashboard', author: 'MÉNU Team', rating: 4.9, downloads: 4100, price: 0, tags: ['React', 'TanStack Table', 'Shadcn'] },
  { id: '6', title: 'Landing Page SaaS', description: "Page d'accueil moderne pour SaaS", category: 'form', author: 'Community', rating: 4.5, downloads: 2800, price: 0, tags: ['React', 'Framer Motion', 'Tailwind'] },
]

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = items.filter(item => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                       item.description.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
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
                  Gratuit
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-text-muted text-sm mb-4">{item.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {item.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-white/5 text-text-muted text-xs rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

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
                <button className="px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors">
                  Utiliser
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
              }
