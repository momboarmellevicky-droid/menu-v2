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
        const success = await editCurrentProject(text)
        if (success) setPrompt('')
      } else if (architecture === 'fullstack') {
        await generateFullStack(text)
        setPrompt('')
      } else {
        await generate(text, exportFormat)
        setPrompt('')
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
            </button>
          ))}
        </div>

        {currentCode?.projectId && (
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Pencil size={14} />
              Mode édition — décris le changement à apporter au projet actuel
            </div>
            <button
              onClick={handleNewProject}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors"
            >
              <Plus size={14} />
              Nouveau projet
            </button>
          </div>
        )}

        <div className="bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-2 mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={
                currentCode?.projectId
                  ? 'Ex: Change la couleur du bouton en bleu, ajoute un champ email...'
                  : "Ex: Crée une application de gestion pour mon restaurant avec tableau de bord..."
              }
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-text-muted outline-none text-base"
            />
            <VoiceButton
              isListening={isListening}
              onStart={handleStartListening}
              onStop={stopListening}
            />
            <button
              onClick={handleSubmit}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform flex items-center gap-2"
            >
              {isGenerating ? (
                <Sparkles size={18} className="animate-spin" />
              ) : currentCode?.projectId ? (
                <Pencil size={18} />
              ) : (
                <Send size={18} />
              )}
              {currentCode?.projectId ? 'Modifier' : 'Générer'}
            </button>
          </div>
          {voiceError && (
            <p className="text-xs text-red-400 px-4 pb-2">{voiceError}</p>
          )}
        </div>

        {!isGenerating && !currentCode && (
          <div className="flex items-center gap-3 mb-8">
            <span className="text-sm text-text-muted">Format d'export :</span>
            {exportFormats.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setExportFormat(fmt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  exportFormat === fmt.value
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border bg-bg-card text-text-muted hover:border-primary/30'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        )}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-8 space-y-3"
            >
              {errorDetails ? (
                <>
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-400 text-sm mb-1">{errorDetails.title}</h3>
                      <p className="text-sm text-white/80 leading-relaxed">{errorDetails.explanation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-3 border-t border-red-500/20">
                    <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">Solution proposée</p>
                      <p className="text-sm text-text-muted leading-relaxed">{errorDetails.suggestion}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-400">{error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles size={18} className="text-primary animate-pulse" />
                  Agents IA en action — {architecture === 'fullstack' ? 'Mode Full Stack' : 'Mode Frontend'}
                </h3>
                <span className="text-sm text-text-muted font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <AgentStatus agents={agents} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentCode && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-bg-card border border-border rounded-xl p-1">
                  <button
                    onClick={() => setView('preview')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      view === 'preview' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    Aperçu
                  </button>
                  <button
                    onClick={() => setView('code')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      view === 'code' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    Code
                  </button>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-lg border border-primary/20">
                    {currentCode.framework}
                  </span>
                  {diagnostics.length === 0 ? (
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg border border-green-500/20 flex items-center gap-1">
                      <ShieldCheck size={14} />
                      Aucune faille détectée
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-lg border border-orange-500/20 flex items-center gap-1">
                      <ShieldAlert size={14} />
                      {diagnostics.length} faille(s) détectée(s)
                    </span>
                  )}
                  {deployUrl ? (
                    <a
                      href={deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg border border-green-500/20 flex items-center gap-1 hover:bg-green-500/20 transition-colors"
                    >
                      <ExternalLink size={14} />
                      App en ligne
                    </a>
                  ) : (
                    <button
                      onClick={handleDeploy}
                      disabled={deploying || !currentCode.projectId}
                      className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-lg border border-primary/20 flex items-center gap-1 hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {deploying ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                      {deploying ? 'Déploiement...' : 'Déployer'}
                    </button>
                  )}
                </div>
              </div>

              {deployError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                  {deployError}
                </div>
              )}
              {deployUrl && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-xs flex items-center justify-between gap-2">
                  <span className="truncate">{deployUrl}</span>
                  <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 underline">
                    Ouvrir
                  </a>
                </div>
              )}

              {diagnostics.length > 0 && (
                <div className="bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <ShieldAlert size={16} className="text-orange-400" />
                      Rapport de failles détectées
                    </h4>
                    <div className="flex gap-2 text-xs">
                      {criticalCount > 0 && (
                        <span className="text-red-400">{criticalCount} critique(s)</span>
                      )}
                      {warningCount > 0 && (
                        <span className="text-yellow-400">{warningCount} avertissement(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {diagnostics.map((diag) => {
                      const style = severityStyles[diag.severity] || severityStyles.info
                      const Icon = style.icon
                      return (
                        <div
                          key={diag.id}
                          className={`rounded-xl border p-3 ${style.bg} ${style.border}`}
                        >
                          <div className="flex items-start gap-2">
                            <Icon size={16} className={`${style.color} mt-0.5 shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`text-xs font-semibold ${style.color}`}>{style.label}</span>
                                <span className="text-xs text-text-muted font-mono">{diag.service}</span>
                                <span className="text-xs text-text-muted">→ {diag.location}</span>
                                {diag.autoFixed && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                                    Corrigé automatiquement
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white/90">{diag.description}</p>
                              <p className="text-xs text-text-muted mt-1">
                                <span className="font-semibold">Recommandation :</span> {diag.recommendation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {view === 'preview' && (currentCode.framework === 'react' || currentCode.language === 'tsx') ? (
                <LivePreview code={currentCode.code} files={currentCode.files} framework="react" />
              ) : view === 'preview' && currentCode.language === 'html' ? (
                <LivePreview code={currentCode.code} files={currentCode.files} framework="html" />
              ) : (
                <div className="space-y-2">
                  {currentCode.files && Object.keys(currentCode.files).length > 1 && (
                    <div className="flex gap-1 flex-wrap">
                      {Object.keys(currentCode.files).map((path) => (
                        <button
                          key={path}
                          onClick={() => setSelectedFile(path)}
                          className={`px-2.5 py-1 text-xs rounded-lg border font-mono transition-colors ${
                          (selectedFile || Object.keys(currentCode.files!)[0]) === path
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-border bg-bg-card text-text-muted hover:border-primary/30'
                        }`}
                      >
                        {path}
                      </button>
                    ))}
                  </div>
                )}
                <CodeBlock
                  code={
                    currentCode.files && Object.keys(currentCode.files).length > 0
                      ? currentCode.files[selectedFile || Object.keys(currentCode.files)[0]]
                      : currentCode.code
                  }
                  language={currentCode.language}
                  filename={selectedFile || `component.${currentCode.language}`}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </div>
)
}
                         
