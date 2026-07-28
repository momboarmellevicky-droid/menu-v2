import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { api, supabase } from '../lib/api'

export function useAuth() {
  const { user, isAuthenticated, isLoading, login: storeLogin, logout: storeLogout, setLoading } = useAuthStore()
  const [sessionChecked, setSessionChecked] = useState(false)

  // Restaure la session au chargement de l'app (rafraîchissement de page, etc.)
  useEffect(() => {
    let mounted = true

    const restoreSession = async () => {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          const profile = await api.getUser()
          if (mounted && profile) storeLogin(profile)
        } else if (mounted) {
          storeLogout()
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setSessionChecked(true)
        }
      }
    }

    restoreSession()

    // Garde le store synchronisé si la session change ailleurs (autre onglet, expiration...)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        storeLogout()
        return
      }
      const profile = await api.getUser()
      if (profile) storeLogin(profile)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      await api.signIn(email, password)
      const profile = await api.getUser()
      if (!profile) throw new Error('Profil introuvable après connexion')
      storeLogin(profile)
    } finally {
      setLoading(false)
    }
  }, [storeLogin, setLoading])

  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const data = await api.signUp(email, password, name)
      // Si la confirmation email est activée côté Supabase, il n'y a pas de session immédiate
      if (!data.session) {
        setLoading(false)
        return { needsEmailConfirmation: true }
      }
      const profile = await api.getUser()
      if (profile) storeLogin(profile)
      return { needsEmailConfirmation: false }
    } finally {
      setLoading(false)
    }
  }, [storeLogin, setLoading])

  const logout = useCallback(async () => {
    await api.signOut()
    storeLogout()
  }, [storeLogout])

  return {
    user,
    isAuthenticated,
    isLoading,
    sessionChecked,
    login,
    register,
    logout,
  }
}
