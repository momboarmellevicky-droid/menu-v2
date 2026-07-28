import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import OrbBackground from '../ui/OrbBackground'
import { useAuth } from '../../hooks/useAuth'

export default function Layout() {
  // Restaure la session Supabase (si existante) au chargement de l'app
  useAuth()

  return (
    <div className="relative min-h-screen">
      <OrbBackground />
      <Navbar />
      <main className="relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}