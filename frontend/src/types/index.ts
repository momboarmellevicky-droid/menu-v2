export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin' | 'team'
  credits: number
}

export interface DiagnosticEntry {
  id: string
  service: string
  location: string
  category: 'security' | 'accessibility' | 'performance' | 'quality' | 'dependency'
  severity: 'critical' | 'warning' | 'info'
  description: string
  recommendation: string
  autoFixed: boolean
}

export interface GeneratedCode {
  id: string
  prompt: string
  code: string
  files?: Record<string, string>
  language: string
  framework: 'react' | 'html' | 'vue' | 'react-native'
  createdAt: Date
  projectId?: string
  diagnostics?: DiagnosticEntry[]
}

export interface Project {
  id: string
  name: string
  description: string
  architecture: 'frontend' | 'fullstack' | 'mobile'
  components: GeneratedCode[]
  memory: ProjectMemory
  createdAt: Date
  updatedAt: Date
  collaborators: string[]
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
  timestamp: Date
  author: string
}

export interface AIAgent {
  id: string
  name: string
  role: 'analyst' | 'architect' | 'designer' | 'developer' | 'tester' | 'optimizer'
  status: 'idle' | 'working' | 'completed' | 'error'
  progress: number
  message: string
}

export interface MarketplaceItem {
  id: string
  title: string
  description: string
  category: 'dashboard' | 'crm' | 'ecommerce' | 'form' | 'template'
  author: string
  rating: number
  downloads: number
  price: number
  preview: string
}

export interface DeployTarget {
  id: string
  name: string
  platform: 'web' | 'pwa' | 'android' | 'ios'
  status: 'ready' | 'building' | 'deployed' | 'error'
  url?: string
}

export type ExportFormat = 'react' | 'html' | 'vue' | 'react-native'

export interface ExplainedError {
  title: string
  explanation: string
  suggestion: string
  category: 'quota' | 'config' | 'timeout' | 'validation' | 'network' | 'unknown'
}

export interface AnalyticsData {
  projectsCreated: number
  timeSaved: number
  errorsFixed: number
  featuresUsed: Record<string, number>
  creditsUsed: number
  creditsRemaining: number
}
