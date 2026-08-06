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
  editCurrentProject: (instruction: string) => Promise<boolean>
}

const AGENT_NAMES = ['Analyste', 'Architecte', 'Designer', 'Développeur', 'Testeur', 'Optimiseur']

export function useCodeGeneration(): UseCodeGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [agents, setAgents] = useState<{ name: string; status: string; progress: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<ExplainedError | null>(null)
  const { addToHistory, setCurrentCode, currentCode } = useCodeStore()

  // Progression réelle : reçoit les événements 'progress' envoyés par le
  // backend au fur et à mesure que chaque agent termine réellement son
  // travail (plus de simulation par setInterval côté client).
  const initAgents = useCallback((names: string[]) => {
    setAgents(names.map((name, i) => ({ name, status: i === 0 ? 'working' : 'waiting', progress: 0 })))
    setProgress(0)
  }, [])

  const handleRealProgress = useCallback((agent: string, pct: number) => {
    setProgress(pct)
    setAgents(prev => {
      const idx = prev.findIndex(a => a.name === agent)
      if (idx === -1) {
        // Agent non prévu au départ (ex: "Correction automatique") : on l'ajoute.
        return [...prev.map(a => ({ ...a, status: 'completed', progress: 100 })), { name: agent, status: 'working', progress: pct }]
      }
      return prev.map((a, i) => (
        i < idx ? { ...a, status: 'completed', progress: 100 } :
        i === idx ? { ...a, status: 'working', progress: pct } :
        a
      ))
    })
  }, [])

  const finishProgress = useCallback((realAgents?: { name: string; status: string }[]) => {
    setProgress(100)
    if (realAgents && realAgents.length > 0) {
      setAgents(realAgents.map(a => ({ name: a.name, status: a.status || 'completed', progress: 100 })))
    } else {
      setAgents(prev => prev.map(a => ({ ...a, status: 'completed', progress: 100 })))
    }
  }, [])

  const handleGenerationError = (err: unknown) => {
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
    initAgents(AGENT_NAMES)

    try {
      const result = await api.generateCode(prompt, handleRealProgress, framework, projectId)

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
  }, [initAgents, handleRealProgress, finishProgress, setCurrentCode, addToHistory])

  const generateFullStack = useCallback(async (prompt: string) => {
    setIsGenerating(true)
    setError(null)
    setErrorDetails(null)
    initAgents(AGENT_NAMES)

    try {
      const result = await api.generateFullStack(prompt, handleRealProgress)

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
  }, [initAgents, handleRealProgress, finishProgress, setCurrentCode, addToHistory])

  const editCurrentProject = useCallback(async (instruction: string) => {
    if (!currentCode?.projectId) return
    setIsGenerating(true)
    setError(null)
    setErrorDetails(null)
    initAgents(['Éditeur'])

    try {
      const result = await api.editCode(currentCode.projectId, instruction, handleRealProgress)

      const code: GeneratedCode = {
        id: result.id,
        prompt: instruction,
        code: result.code,
        files: result.files,
        language: currentCode.language,
        framework: currentCode.framework,
        createdAt: new Date(),
        projectId: result.projectId,
        diagnostics: result.repair?.diagnostics || [],
      }

      finishProgress([{ name: 'Éditeur', status: 'completed' }])
        setCurrentCode(code)
        addToHistory(code)
        return true
      } catch (err) {
        handleGenerationError(err)
        return false
      } finally {
        setIsGenerating(false)
      }
    }, [currentCode, initAgents, handleRealProgress, finishProgress, setCurrentCode, addToHistory])

  return { isGenerating, progress, agents, currentCode, error, errorDetails, generate, generateFullStack, editCurrentProject }
}
