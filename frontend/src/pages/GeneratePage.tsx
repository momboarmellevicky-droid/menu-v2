import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Copy, Check, Download, Sparkles, Mic, Layers, Smartphone, Globe, Database } from 'lucide-react'
import VoiceButton from '../components/ui/VoiceButton'
import AgentStatus from '../components/ui/AgentStatus'
import CodeBlock from '../components/ui/CodeBlock'
import MemoryBadge from '../components/ui/MemoryBadge'
import { useCodeGeneration } from '../hooks/useCodeGeneration'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { ExportFormat } from '../types'

const exportFormats: { value: ExportFormat; label: string; icon: typeof Globe }[] = [
  { value: 'react', label: 'React', icon: Globe },
  { value: 'html', label: 'HTML', icon: Globe },
  { value: 'vue', label: 'Vue.js', icon: Globe },
  { value: 'react-native', label: 'React Native', icon: Smartphone },
]

const architectureModes = [
  { id: 'frontend', label: 'Frontend', icon: Globe, desc: 'Composants UI uniquement' },
  { id: 'fullstack', label: 'Full Stack', icon: Layers, desc: 'Frontend + Backend + DB' },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, desc: 'App React Native' },
]

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [architecture, setArchitecture] = useState('frontend')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('react')
  const { isListening, transcript, startListening, stopListening, error: voiceError } = useVoiceInput()
  const { isGenerating, progress, agents, currentCode, error, generate, generateFullStack } = useCodeGeneration()

  const handleSubmit = async () => {
    const text = prompt || transcript
    if (!text.trim()) return

    if (architecture === 'fullstack') {
      await generateFullStack(text)
    } else {
      await generate(text, exportFormat)
    }
  }

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

        <div className="grid grid-cols-3 gap-3 mb-6">
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

        <div className="bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-2 mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt || transcript}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Ex: Crée une application de gestion pour mon restaurant avec tableau de bord..."
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-text-muted outline-none text-base"
            />
            <VoiceButton
              isListening={isListening}
              onStart={startListening}
              onStop={stopListening}
            />
            <button
              onClick={handleSubmit}
              disabled={isGenerating || (!prompt.trim() && !transcript.trim())}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform flex items-center gap-2"
            >
              {isGenerating ? (
                <Sparkles size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              Générer
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
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 text-red-400 text-sm"
            >
              {error}
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
