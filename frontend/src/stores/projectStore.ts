import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Project, AIAgent } from '../types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  agents: AIAgent[]
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  setCurrentProject: (project: Project | null) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setAgents: (agents: AIAgent[]) => void
  updateAgent: (id: string, updates: Partial<AIAgent>) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      currentProject: null,
      agents: [],
      setProjects: (projects) => set({ projects }),
      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),
      setCurrentProject: (project) => set({ currentProject: project }),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        })),
      setAgents: (agents) => set({ agents }),
      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
    }),
    {
      name: 'menu-projects-v2',
      partialize: (state) => ({ projects: state.projects }),
    }
  )
)