import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Users, Mail, Crown, Shield, User, Loader2, X } from 'lucide-react'
import { api } from '../lib/api'
import { Project } from '../types'

interface TeamMember {
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  profiles?: { full_name?: string; email?: string; avatar_url?: string }
}

const roleLabels = {
  owner: { label: 'Propriétaire', icon: Crown, color: 'text-yellow-400' },
  admin: { label: 'Administrateur', icon: Shield, color: 'text-primary' },
  editor: { label: 'Éditeur', icon: User, color: 'text-secondary' },
  viewer: { label: 'Lecteur', icon: User, color: 'text-text-muted' },
}

export default function TeamPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [showInvite, setShowInvite] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getProjects()
      .then((data) => {
        setProjects(data)
        if (data.length > 0) setSelectedProjectId(data[0].id)
      })
      .catch(() => setError('Impossible de charger vos projets'))
      .finally(() => setIsLoading(false))
  }, [])

  const loadMembers = useCallback((projectId: string) => {
    if (!projectId) return
    api.getTeamMembers(projectId)
      .then((data) => setMembers(data as TeamMember[]))
      .catch(() => setError("Impossible de charger l'équipe"))
  }, [])

  useEffect(() => {
    if (selectedProjectId) loadMembers(selectedProjectId)
  }, [selectedProjectId, loadMembers])

  const handleInvite = async () => {
    if (!inviteEmail || !selectedProjectId) return
    setIsInviting(true)
    setError(null)
    try {
      await api.inviteMember(selectedProjectId, inviteEmail, inviteRole)
      setInviteEmail('')
      setShowInvite(false)
      loadMembers(selectedProjectId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'invitation")
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!selectedProjectId) return
    try {
      await api.removeMember(selectedProjectId, userId)
      loadMembers(selectedProjectId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    }
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-4xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
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
            disabled={!selectedProjectId}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-xl hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Inviter
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        {!isLoading && projects.length > 1 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="mb-6 bg-bg-card border border-border rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

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
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="bg-bg border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary"
              >
                <option value="editor">Éditeur</option>
                <option value="viewer">Lecteur</option>
                <option value="admin">Administrateur</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail}
                className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isInviting && <Loader2 size={16} className="animate-spin" />}
                Envoyer
              </button>
            </div>
          </motion.div>
        )}

        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <span className="font-semibold">{members.length} membre{members.length !== 1 ? 's' : ''}</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-text-muted">
              <Loader2 size={24} className="mx-auto mb-3 animate-spin" />
              Chargement...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p>Créez d'abord un projet pour inviter votre équipe.</p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p>Aucun membre pour l'instant. Invitez votre équipe !</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((member) => {
                const roleConfig = roleLabels[member.role] || roleLabels.viewer
                const RoleIcon = roleConfig.icon
                const name = member.profiles?.full_name || member.profiles?.email || 'Membre'

                return (
                  <div key={member.user_id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{name}</p>
                        <p className="text-xs text-text-muted">{member.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${roleConfig.color} bg-white/5`}>
                        <RoleIcon size={14} />
                        {roleConfig.label}
                      </div>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(member.user_id)}
                          className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                          title="Retirer"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
                }
