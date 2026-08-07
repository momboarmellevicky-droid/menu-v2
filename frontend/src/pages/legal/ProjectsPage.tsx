import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderOpen, Loader2, Trash2, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { Project } from '../types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .catch(() => setError('Impossible de charger vos projets'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement ce projet ?')) return
    setDeletingId(id)
    try {
      await api.deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-5xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Mes projets</h1>
            <p className="text-text-muted">Tous vos projets générés avec MÉNU.</p>
          </div>
          <Link
            to="/generate"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-xl hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-shadow"
          >
            <Plus size={18} />
            Nouveau
          </Link>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">
              <Loader2 size={24} className="mx-auto mb-3 animate-spin" />
              Chargement...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <FolderOpen size={32} className="mx-auto mb-3 opacity-50" />
              <p>Aucun projet pour l'instant. Créez-en un !</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                >
                  <Link
                    to={`/generate?project=${project.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderOpen size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-text-muted">
                        {project.architecture?.toUpperCase()} • {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id)}
                    disabled={deletingId === project.id}
                    className="p-2 text-text-muted hover:text-red-400 transition-colors shrink-0 disabled:opacity-40"
                  >
                    {deletingId === project.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
