import { useState, useCallback } from 'react'
import { useCodeStore } from '../stores/codeStore'
import { GeneratedCode } from '../types'
import { generateId } from '../lib/utils'

interface UseCodeGenerationReturn {
  isGenerating: boolean
  progress: number
  agents: { name: string; status: string; progress: number }[]
  error: string | null
  generate: (prompt: string, framework?: string) => Promise<void>
  generateFullStack: (prompt: string) => Promise<void>
}

export function useCodeGeneration(): UseCodeGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [agents, setAgents] = useState<{ name: string; status: string; progress: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const { addToHistory, setCurrentCode } = useCodeStore()

  const simulateAgents = useCallback(async () => {
    const agentSteps = [
      { name: 'Analyste', status: 'working', progress: 0 },
      { name: 'Architecte', status: 'waiting', progress: 0 },
      { name: 'Designer', status: 'waiting', progress: 0 },
      { name: 'Développeur', status: 'waiting', progress: 0 },
      { name: 'Testeur', status: 'waiting', progress: 0 },
      { name: 'Optimiseur', status: 'waiting', progress: 0 },
    ]

    for (let i = 0; i < agentSteps.length; i++) {
      setAgents(prev => prev.map((a, idx) => 
        idx === i ? { ...a, status: 'working' } : 
        idx < i ? { ...a, status: 'completed', progress: 100 } :
        a
      ))

      // Simulate agent working
      for (let p = 0; p <= 100; p += 20) {
        await new Promise(r => setTimeout(r, 150))
        setAgents(prev => prev.map((a, idx) => 
          idx === i ? { ...a, progress: p } : a
        ))
        setProgress(Math.floor(((i * 100 + p) / 600) * 100))
      }
    }

    setAgents(prev => prev.map(a => ({ ...a, status: 'completed', progress: 100 })))
    setProgress(100)
  }, [])

  const generate = useCallback(async (prompt: string, framework: string = 'react') => {
    setIsGenerating(true)
    setProgress(0)
    setError(null)

    try {
      await simulateAgents()

      // Mock generation
      await new Promise(r => setTimeout(r, 500))

      const code: GeneratedCode = {
        id: generateId(),
        prompt,
        code: `// Généré par MÉNU v2.0
import React from 'react'

export default function GeneratedComponent() {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800">
        ${prompt.slice(0, 30)}...
      </h2>
      <p className="mt-2 text-gray-600">
        Composant généré automatiquement avec MÉNU
      </p>
    </div>
  )
}`,
        language: framework === 'react' ? 'tsx' : framework,
        framework: framework as 'react' | 'html' | 'vue' | 'react-native',
        createdAt: new Date(),
      }

      setCurrentCode(code)
      addToHistory(code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération')
    } finally {
      setIsGenerating(false)
    }
  }, [simulateAgents, setCurrentCode, addToHistory])

  const generateFullStack = useCallback(async (prompt: string) => {
    setIsGenerating(true)
    setProgress(0)
    setError(null)

    try {
      await simulateAgents()

      const frontend: GeneratedCode = {
        id: generateId(),
        prompt: `${prompt} - Frontend`,
        code: '// Frontend React/TypeScript\n// ...',
        language: 'tsx',
        framework: 'react',
        createdAt: new Date(),
      }

      setCurrentCode(frontend)
      addToHistory(frontend)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération')
    } finally {
      setIsGenerating(false)
    }
  }, [simulateAgents, setCurrentCode, addToHistory])

  return { isGenerating, progress, agents, error, generate, generateFullStack }
}