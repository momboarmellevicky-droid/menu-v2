import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Zap } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-32 px-4 text-center relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-sm text-primary mb-8">
            <Zap size={14} />
            100% Gratuit pour démarrer
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Prêt à{' '}
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              transformer vos idées
            </span>
            <br />
            en applications ?
          </h2>

          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-10">
            Rejoignez la révolution du développement no-code. Créez, collaborez et déployez 
            sans écrire une seule ligne de code.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/generate"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold text-lg rounded-2xl shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:shadow-[0_0_60px_rgba(124,58,237,0.5)] transition-all hover:scale-105"
            >
              <Sparkles size={20} />
              Commencer gratuitement
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-4 bg-bg-card border border-border text-white font-medium rounded-2xl hover:border-primary/50 transition-colors"
            >
              Explorer la Marketplace
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}