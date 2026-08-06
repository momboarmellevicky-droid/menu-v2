import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import GeneratePage from './pages/GeneratePage'
import LoginPage from './pages/LoginPage'
import MarketplacePage from './pages/MarketplacePage'
import TeamPage from './pages/TeamPage'
import DeployPage from './pages/DeployPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import PricingPage from './pages/PricingPage'
import TermsPage from './pages/legal/TermsPage'
import PrivacyPage from './pages/legal/PrivacyPage'
import SecurityPage from './pages/legal/SecurityPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/legal/terms" element={<TermsPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/security" element={<SecurityPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
  
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
