export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin' | 'team'
  credits: number
}

export interface GeneratedCode {
  id: string
  prompt: string
  code: string
  language: string
  framework: string
  agentLogs: AgentLog[]
  createdAt: string
}

export interface AgentLog {
  agent: string
  status: 'success' | 'error'
  timestamp: string
  output?: string
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string
  architecture: 'frontend' | 'fullstack' | 'mobile'
  status: 'draft' | 'generating' | 'completed' | 'error'
  memory: ProjectMemory
  collaborators: string[]
  createdAt: string
  updatedAt: string
}

export interface ProjectMemory {
  vision: string
  architecture: string
  history: Modification[]
  preferences: Record<string, unknown>
  components: string[]
}

export interface Modification {
  id: string
  type: 'add' | 'edit' | 'delete'
  description: string
  timestamp: string
  author: string
}

export interface MarketplaceItem {
  id: string
  title: string
  description: string
  category: string
  authorId: string
  code: string
  previewUrl?: string
  rating: number
  downloads: number
  price: number
  tags: string[]
  isApproved: boolean
  createdAt: string
}

export interface Deployment {
  id: string
  projectId: string
  platform: 'web' | 'pwa' | 'android' | 'ios'
  status: 'pending' | 'building' | 'deployed' | 'error'
  url?: string
  buildLogs?: string
  createdAt: string
  deployedAt?: string
}

export interface TeamMember {
  id: string
  projectId: string
  userId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  invitedBy: string
  createdAt: string
}

export interface AnalyticsData {
  projectsCreated: number
  codesGenerated: number
  timeSavedHours: number
  errorsFixed: number
  creditsUsed: number
  creditsRemaining: number
  featuresUsed: Record<string, number>
  date: string
}

export interface AIAgent {
  id: string
  name: string
  role: string
  systemPrompt: string
}

export interface GenerationResult {
  agent: string
  output: string
  status: 'success' | 'error'
  timestamp: string
}

export interface RepairResult {
  fixed: boolean
  originalCode: string
  fixedCode: string
  errors: string[]
  warnings: string[]
}