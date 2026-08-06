import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/api'
import { api } from '../lib/api'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SUPPRIMER') return
    setIsDeleting(true)
    setError(null)
    try {
      await api.deleteAccount()
      await supabase.auth.signOut()
      logout()
      navigate('/')
    } catch (err) {
      setError('La suppression a échoué. Réessaie ou contacte le support.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-2xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-1">Paramètres</h1>
        <p className="text-slate-400 mb-10">{user?.email}</p>

        <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="text-red-400 shrink-0 mt-1" size={20} />
            <div>
              <h2 className="text-lg font-semibold text-red-400">Supprimer mon compte</h2>
              <p className="text-sm text-slate-400 mt-1">
                Cette action est irréversible. Toutes tes données (profil, projets, historique) seront définitivement supprimées.
              </p>
            </div>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
              Supprimer mon compte
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                Tape <span className="font-mono text-red-400">SUPPRIMER</span> pour confirmer.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-red-500"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== 'SUPPRIMER' || isDeleting}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="animate-spin" size={16} />}
                  Confirmer la suppression
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setConfirmText('') }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition-colors text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

