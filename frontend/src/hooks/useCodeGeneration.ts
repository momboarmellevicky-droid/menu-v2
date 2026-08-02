import { useState, useCallback, useRef } from 'react'
import { useCodeStore } from '../stores/codeStore'
import { GeneratedCode, ExplainedError } from '../types'
import { api, ApiError } from '../lib/api'

interface UseCodeGenerationReturn {
  isGenerating: boolean
  progress: number
  agents: { name: string; status: string; progress: number }[]
  currentCode: GeneratedCode | null
  error: string | null
  errorDetails: ExplainedError | null
  generate: (prompt: string, framework?: string, projectId?: string) => Promise<void>
  generateFullStack: (prompt: string) => Promise<void>
}

const AGENT_NAMES = ['Analyste', 'Architecte', 'Designer', 'Développeur', 'Testeur', 'Optimiseur']

export function useCodeGeneration(): UseCodeGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [agents, setAgents] = useState<{ name: string; status: string; progress: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<ExplainedError | null>(null)
  const { addToHistory, setCurrentCode, currentCode } = useCodeStore()
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startFakeProgress = useCallback(() => {
    setAgents(AGENT_NAMES.map((name, i) => ({ name, status: i === 0 ? 'working' : 'waiting', progress: 0 })))
    setProgress(0)
    let step = 0
    progressTimer.current = setInterval(() => {
      step += 1
      const pct = Math.min(90, step * 4)
      setProgress(pct)
      const activeIdx = Math.min(AGENT_NAMES.length - 1, Math.floor((pct / 90) * AGENT_NAMES.length))
      setAgents(prev => prev.map((a, idx) => (
        idx < activeIdx ? { ...a, status: 'completed', progress: 100 } :
        idx === activeIdx ? { ...a, status: 'working', progress: (pct % (90 / AGENT_NAMES.length)) * AGENT_NAMES.length } :
        a
      )))
    }, 250)
  }, [])

  const finishProgress = useCallback((realAgents?: { name: string; status: string }[]) => {
    if (progressTimer.current) clearInterval(progressTimer.current)
    setProgress(100)
    if (realAgents && realAgents.length > 0) {
      setAgents(realAgents.map(a => ({ name: a.name, status: a.status || 'completed', progress: 100 })))
    } else {
      setAgents(prev => prev.map(a => ({ ...a, status: 'completed', progress: 100 })))
    }
  }, [])

  const handleGenerationError = (err: unknown) => {
    if (progressTimer.current) clearInterval(progressTimer.current)
    setProgress(0)
    setAgents([])
    if (err instanceof ApiError) {
      setError(err.message)
      setErrorDetails(err.details || null)
    } else {
      setError(err instanceof Error ? err.message : 'Erreur de génération')
      setErrorDetails(null)
    }
  }

  const generate = useCallback(async (prompt: string, framework: string = 'react', projectId?: string) => {
    setIsGenerating(true)
    setError(null)
    setErrorDetails(null)
    startFakeProgress()

    try {
      const result = await api.generateCode(prompt, framework, projectId)

      const code: GeneratedCode = {
        id: result.id,
        prompt,
        code: result.code,
        files: result.files,
        language: framework === 'react' ? 'tsx' : framework,
        framework: framework as 'react' | 'html' | 'vue' | 'react-native',
        createdAt: new Date(),
        projectId: result.projectId || projectId,
        diagnostics: result.repair?.diagnostics || [],
      }

      finishProgress(result.agents)
      setCurrentCode(code)
      addToHistory(code)
    } catch (err) {
      handleGenerationError(err)
    } finally {
      setIsGenerating(false)
    }
  }, [startFakeProgress, finishProgress, setCurrentCode, addToHistory])

  const generateFullStack = useCallback(async (prompt: string) => {
    setIsGenerating(true)
    setError(null)
    setErrorDetails(null)
    startFakeProgress()

    try {
      const result = await api.generateFullStack(prompt)

      const frontend: GeneratedCode = {
        id: `${result.projectId}-frontend`,
        prompt: `${prompt} - Frontend`,
        code: result.frontend,
        language: 'tsx',
        framework: 'react',
        createdAt: new Date(),
        projectId: result.projectId,
      }
      const backend: GeneratedCode = {
        id: `${result.projectId}-backend`,
        prompt: `${prompt} - Backend`,
        code: result.backend,
        language: 'ts',
        framework: 'react',
        createdAt: new Date(),
        projectId: result.projectId,
      }
      const database: GeneratedCode = {
        id: `${result.projectId}-database`,
        prompt: `${prompt} - Database`,
        code: result.database,
        language: 'sql',
        framework: 'react',
        createdAt: new Date(),
        projectId: result.projectId,
      }

      finishProgress(result.agents)
      setCurrentCode(frontend)
      addToHistory(frontend)
      addToHistory(backend)
      addToHistory(database)
    } catch (err) {
      handleGenerationError(err)
    } finally {
      setIsGenerating(false)
    }
  }, [startFakeProgress, finishProgress, setCurrentCode, addToHistory])

  return { isGenerating, progress, agents, currentCode, error, errorDetails, generate, generateFullStack }
}
