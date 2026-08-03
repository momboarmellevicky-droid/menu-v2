import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Copy, Check, Download, Sparkles, Mic, Layers, Globe, Database, ShieldAlert, ShieldCheck, AlertTriangle, Info, Rocket, ExternalLink, Loader2, Pencil, Plus } from 'lucide-react'
import VoiceButton from '../components/ui/VoiceButton'
import AgentStatus from '../components/ui/AgentStatus'
import CodeBlock from '../components/ui/CodeBlock'
import LivePreview from '../components/ui/LivePreview'
import MemoryBadge from '../components/ui/MemoryBadge'
import { useCodeGeneration } from '../hooks/useCodeGeneration'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { useCodeStore } from '../stores/codeStore'
import { api } from '../lib/api'
import { ExportFormat, GeneratedCode } from '../types'

const exportFormats: { value: ExportFormat; label: string; icon: typeof Globe }[] = [
  { value: 'react', label: 'React', icon: Globe },
  { value: 'html', label: 'HTML', icon: Globe },
]

const architectureModes = [
  { id: 'frontend', label: 'Frontend', icon: Globe, desc: 'Composants UI uniquement' },
  { id: 'fullstack', label: 'Full Stack', icon: Layers, desc: 'Frontend + Backend + Base de données' },
]

const severityStyles: Record<string, { icon: typeof ShieldAlert; color: string; bg: string; border: string; label: string }> = {
  critical: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Critique' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Avertissement' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Info' },
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [architecture, setArchitecture] = useState('frontend')
  const [view, setView] = useState<'preview' | 'code'>('preview')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('react')
  const { isListening, transcript, startListening, stopListening, resetTranscript, error: voiceError } = useVoiceInput()
  const { isGenerating, progress, agents, currentCode, error, errorDetails, generate, generateFullStack, editCurrentProject } = useCodeGeneration()
  const { setCurrentCode } = useCodeStore()
  const [searchParams] = useSearchParams()
  const [loadingProject, setLoadingProject] = useState(false)

  useEffect(() => {
    const projectId = searchParams.get('project')
    if (!projectId) return

    setLoadingProject(true)
    api.getProject(projectId)
      .then((project: any) => {
        const codes = project.generated_codes || []
        if (codes.length === 0) return
        const latest = codes.sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        const reopened: GeneratedCode = {
          id: latest.id,
          prompt: latest.prompt,
          code: latest.code,
          files: latest.files,
          language: latest.language,
          framework: latest.framework,
          createdAt: new Date(latest.created_at),
          projectId: project.id,
        }
        setCurrentCode(reopened)
      })
      .catch(() => {})
      .finally(() => setLoadingProject(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (transcript) {
      setPrompt(prev => (isListening ? transcript : prev))
    }
  }, [transcript, isListening])

  const handleStartListening = () => {
    resetTranscript()
    startListening()
  }

  const handleSubmit = async () => {
    const text = prompt
    if (!text.trim()) return

    setDeployUrl(null)
    setDeployError(null)

    if (currentCode?.projectId) {
      await editCurrentProject(text)
      setPrompt('')
    } else if (architecture === 'fullstack') {
      await generateFullStack(text)
    } else {
      await generate(text, exportFormat)
    }
  }

  const handleNewProject = () => {
    setCurrentCode(null)
    setPrompt('')
    setDeployUrl(null)
    setDeployError(null)
  }

  const handleDeploy = async () => {
    if (!currentCode?.projectId) return
    setDeploying(true)
    setDeployError(null)
    try {
      const result = await api.deploy(currentCode.projectId, 'web') as { url: string }
      setDeployUrl(result.url)
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Erreur de déploiement')
    } finally {
      setDeploying(false)
    }
  }

  const diagnostics = currentCode?.diagnostics || []
  const criticalCount = diagnostics.filter(d => d.severity === 'critical').length
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 max-w-6xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Générer du code
              </span>
            </h1>
            <p className="text-text-muted">Décrivez votre application, les agents IA s'occupent du reste.</p>
          </div>
          <MemoryBadge />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {architectureModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setArchitecture(mode.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                architecture === mode.id
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border bg-bg-card hover:border-primary/30'
              }`}
            >
              <mode.icon size={20} className={architecture === mode.id ? 'text-primary' : 'text-text-muted'} />
              <div className="font-medium text-sm mt-2">{mode.label}</div>
              <div className="text-xs text-text-muted mt-1">{mode.desc}</div>
