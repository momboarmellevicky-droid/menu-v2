import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Mic } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '../ui/Logo'

export default function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-10 text-center relative z-10">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-sm text-primary">
          <Sparkles size={14} />
          MÉNU v2.0 — Ingénieur Numérique IA
        </span>
      </motion.div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col items-center gap-3 mb-10"cg
      >
        <Logo size={100} />
        <div className="text-left">
          <span className="font-mono text-5xl md:text-6xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent block">
            MÉNU
          </span>
          <span className="text-text-muted text-sm font-mono">{ '{ Ingénieur Numérique IA }' }</span>
        </div>
      </motion.div>

      {/* Titre */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 max-w-4xl"
      >
        <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
          De l'idée
        </span>
        <br />
        à l'application complète
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-xl text-text-muted max-w-2xl leading-relaxed mb-10"
      >
        6 agents IA spécialisés analysent, architectent, codent, testent et déploient 
        votre application. Full Stack, Mobile, PWA — en quelques minutes.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center gap-4"
      >
        <Link
          to="/generate"
          className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold text-lg rounded-2xl shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:shadow-[0_0_60px_rgba(124,58,237,0.5)] transition-all hover:scale-105"
        >
          <Sparkles size={20} />
          Commencer gratuitement
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 px-6 py-4 bg-bg-card border border-border text-white font-medium rounded-2xl hover:border-primary/50 transition-colors"
        >
          <Mic size={18} className="text-primary" />
          Essayer la voix
        </Link>
      </motion.div>

      {/* Stats teaser */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-16 flex items-center gap-8 text-sm text-text-muted"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>6 Agents IA actifs</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <span>Full Stack & Mobile</span>
        <div className="w-px h-4 bg-border" />
        <span>Déploiement 1-Click</span>
      </motion.div>
    </section>
  )
}
