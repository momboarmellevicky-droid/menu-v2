import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={36} className="text-primary" />
        </div>

        <h1 className="text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            404
          </span>
        </h1>
        <p className="text-xl text-text-muted mb-8">
          Cette page n'existe pas ou a été déplacée.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-shadow"
        >
          <Home size={18} />
          Retour à l'accueil
        </Link>
      </motion.div>
    </div>
  )
}