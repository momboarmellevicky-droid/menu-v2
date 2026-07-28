import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Code2, Store, Users, Rocket, BarChart3, Settings } from 'lucide-react'

const sidebarItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/generate', icon: Code2, label: 'Générer' },
  { path: '/marketplace', icon: Store, label: 'Marketplace' },
  { path: '/team', icon: Users, label: 'Équipe' },
  { path: '/deploy', icon: Rocket, label: 'Déployer' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 border-r border-border bg-bg-card/50 backdrop-blur-sm min-h-[calc(100vh-64px)] sticky top-16">
      <div className="p-4 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}