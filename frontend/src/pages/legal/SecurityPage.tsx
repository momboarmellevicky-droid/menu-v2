import { motion } from 'framer-motion'
import { ShieldCheck, Lock, KeyRound, Eye, ServerCog } from 'lucide-react'

const measures = [
  {
    icon: KeyRound,
    title: 'Authentification',
    description: "Gestion des comptes et des sessions via Supabase Auth, avec jetons d'accès signés et expirables. Les mots de passe ne sont jamais stockés en clair.",
  },
  {
    icon: Lock,
    title: 'Isolation des données par utilisateur',
    description: "Chaque projet et chaque code généré est strictement rattaché à son propriétaire. Les règles de sécurité au niveau des lignes (RLS) empêchent un utilisateur d'accéder aux données d'un autre.",
  },
  {
    icon: ShieldCheck,
    title: 'Analyse automatique du code généré',
    description: "Chaque application générée est scannée automatiquement : détection de failles XSS potentielles, d'usage d'eval(), de dépendances manquantes, et de mauvaises pratiques d'accessibilité, avant d'être présentée à l'utilisateur.",
  },
  {
    icon: ServerCog,
    title: 'Infrastructure',
    description: "Le backend est hébergé sur Render avec communications chiffrées (HTTPS/TLS). Les clés d'API des fournisseurs d'intelligence artificielle sont stockées comme variables d'environnement chiffrées, jamais exposées côté client.",
  },
  {
    icon: Eye,
    title: 'Journalisation et supervision',
    description: "Les erreurs et anomalies sont journalisées pour permettre une détection rapide d'incidents, sans conserver le contenu sensible des échanges au-delà de ce qui est nécessaire au diagnostic.",
  },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-3xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sécurité</h1>
            <p className="text-sm text-text-muted">Comment MÉNU protège vos données et votre code</p>
          </div>
        </div>

        <p className="text-sm text-text-muted leading-relaxed mb-10">
          La sécurité est un critère central de la conception de MÉNU, aussi bien pour les
          données de nos utilisateurs que pour le code que la plateforme génère automatiquement.
          Voici les mesures mises en place.
        </p>

        <div className="space-y-4">
          {measures.map((m) => (
            <div key={m.title} className="bg-bg-card border border-border rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <m.icon size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{m.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{m.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-2">Signaler une vulnérabilité</h3>
          <p className="text-sm text-text-muted leading-relaxed">
            Si vous identifiez une faille de sécurité potentielle sur MÉNU, merci de la
            signaler de manière responsable en contactant l'éditrice du service, MOMBO ARMELLE
            VICKY, avant toute divulgation publique.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
