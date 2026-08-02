import { createClient } from '@supabase/supabase-js'
import type { GeneratedCode, Project, MarketplaceItem, User } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

class ApiClient {
  private async getToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken()

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.reason ? `${error.error} (${error.reason})` : error.error || `HTTP ${response.status}`)
    }
    return response.json()
  }

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) throw error
    return data
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async signOut() {
    await supabase.auth.signOut()
  }

  async getUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email!,
      name: profile?.full_name || user.email!,
      avatar: profile?.avatar_url,
      role: profile?.role || 'user',
      credits: profile?.credits || 30,
    }
  }

  async updateProfile(updates: Partial<User>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error
  }

  async generateCode(prompt: string, framework: string = 'react', projectId?: string) {
    return this.request<{
      success: boolean
      code: string
      files: Record<string, string>
      id: string
      projectId: string
      agents: { name: string; status: string }[]
      repair: { fixed: boolean; warnings: string[]; errors: string[]; diagnostics: import('../types').DiagnosticEntry[] }
      creditsRemaining: number
    }>('/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, framework, projectId }),
    })
  }

  async generateFullStack(prompt: string) {
    return this.request<{
      success: boolean
      projectId: string
      frontend: string
      backend: string
      database: string
      agents: { name: string; status: string }[]
      creditsRemaining: number
    }>('/generate/fullstack', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    })
  }

  async processVoiceCommand(transcript: string) {
    return this.request<{
      success: boolean
      original: string
      structured: string
    }>('/generate/voice', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    })
  }

  async getProjects(): Promise<Project[]> {
    return this.request('/projects')
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/projects/${id}`)
  }

  async createProject(name: string, description: string, architecture: string = 'frontend') {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description, architecture }),
    })
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, { method: 'DELETE' })
  }

  async getMarketplaceItems(category?: string, search?: string): Promise<MarketplaceItem[]> {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (search) params.append('search', search)
    return this.request(`/marketplace?${params}`)
  }

  async downloadMarketplaceItem(id: string) {
    return this.request<{ code: string }>(`/marketplace/${id}/download`, { method: 'POST' })
  }

  async deploy(projectId: string, platform: string) {
    return this.request('/deploy', {
      method: 'POST',
      body: JSON.stringify({ projectId, platform }),
    })
  }

  async getDeployments(projectId: string) {
    return this.request(`/deploy/${projectId}`)
  }

  async getTeamMembers(projectId: string) {
    return this.request(`/team/${projectId}`)
  }

  async inviteMember(projectId: string, email: string, role: string = 'editor') {
    return this.request('/team/invite', {
      method: 'POST',
      body: JSON.stringify({ projectId, email, role }),
    })
  }

  async removeMember(projectId: string, userId: string) {
    return this.request(`/team/${projectId}/${userId}`, { method: 'DELETE' })
  }

  async getProfile() {
    return this.request('/auth/profile')
  }

  async getCredits() {
    return this.request<{ credits: number }>('/auth/credits')
  }
}

export const api = new ApiClient()
