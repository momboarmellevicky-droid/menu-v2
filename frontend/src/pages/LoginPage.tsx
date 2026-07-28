import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
        navigate('/dashboard')
      } else {
        const result = await register(email, password, name)
        if (result.needsEmailConfirmation) {
          setInfo('Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.')
          setIsLogin(true)
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size={60} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold">{isLogin ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="text-text-muted text-sm mt-1">
            {isLogin ? 'Bienvenue sur MÉNU v2.0' : 'Rejoignez la révolution du no-code'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">Nom complet</label>
              <div className="relative">
                <Sparkles size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  required
                  className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-3 text-white placeholder-text-muted outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-3 text-white placeholder-text-muted outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mot de passe</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-bg border border-border rounded-xl pl-10 pr-12 py-3 text-white placeholder-text-muted outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Se connecter' : 'Créer mon compte'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center mt-6 text-sm text-text-muted">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{' '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); setInfo(null) }}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
