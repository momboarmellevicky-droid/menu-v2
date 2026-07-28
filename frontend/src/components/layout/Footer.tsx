import { Link } from 'react-router-dom'
import Logo from '../ui/Logo'

const footerLinks = [
  {
    title: 'Produit',
    links: [
      { label: 'Générer du code', href: '/generate' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Déploiement', href: '/deploy' },
      { label: 'Analytics', href: '/analytics' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Tutoriels', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '#' },
      { label: 'Carrières', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Presse', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Logo size={32} animated={false} />
              <span className="font-mono font-bold text-lg">MÉNU</span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed mb-4">
              Transformez vos idées en applications complètes avec l'IA.
            </p>
            <p className="text-xs text-text-muted">
              © 2026 MÉNU. Tous droits réservés.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-text-muted hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-text-muted">
            Fondatrice : <span className="text-white font-medium">MOMBO ARMELLE VICKY</span>
          </p>
        </div>
      </div>
    </footer>
  )
}