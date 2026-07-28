import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Users, Mail, Crown, Shield, User } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  avatar?: string
}

const mockMembers: TeamMember[] = [
  { id: '1', name: 'MOMBO ARMELLE VICKY', email: 'vicky@menu.ai', role: 'owner' },
  { id: '2', name: 'Jean Dupont', email: 'jean@menu.ai', role: 'admin' },
  { id: '3', name: 'Marie Martin', email: 'marie@menu.ai', role: 'editor' },
]

const roleLabels = {
  owner: { label: 'Propriétaire', icon: Crown, color: 'text-yellow-400' },
  admin: { label: 'Administrateur', icon: Shield, color: 'text-primary' },
  editor: { label: 'Éditeur', icon: User, color: 'text-secondary' },
  viewer: { label: 'Lecteur', icon: User, color: 'text-text-muted' },
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers)
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInvite, setShowInvite] = useState(false)

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-4xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                MÉNU Team
              </span>
            </h1>
            <p className="text-text-muted">Collaboration en temps réel sur vos projets.</p>
          </div>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-xl hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-shadow"
          >
            <Plus size={18} />
            Inviter
          </button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-bg-card border border-border rounded-2xl p-6 mb-8"
          >
            <h3 className="font-semibold mb-4">Inviter un membre</h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-3 text-white placeholder-text-muted outline-none focus:border-primary"
                />
              </div>
              <select className="bg-bg border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary">
                <option value="editor">Éditeur</option>
                <option value="viewer">Lecteur</option>
                <option value="admin">Administrateur</option>
              </select>
              <button className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/80 transition-colors">
                Envoyer
              </button>
            </div>
          </motion.div>
        )}

        {/* Members list */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <span className="font-semibold">{members.length} membres</span>
          </div>

          <div className="divide-y divide-border">
            {members.map((member) => {
              const roleConfig = roleLabels[member.role]
              const RoleIcon = roleConfig.icon

              return (
                <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-text-muted">{member.email}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${roleConfig.color} bg-white/5`}>
                    <RoleIcon size={14} />
                    {roleConfig.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}