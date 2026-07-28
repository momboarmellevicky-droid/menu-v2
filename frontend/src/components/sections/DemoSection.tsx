import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Mic, Sparkles } from 'lucide-react'
import VoiceButton from '../ui/VoiceButton'
import AgentStatus from '../ui/AgentStatus'
import CodeBlock from '../ui/CodeBlock'
import { useCodeGeneration } from '../../hooks/useCodeGeneration'
import { useVoiceInput } from '../../hooks/useVoiceInput'

export default function DemoSection() {
  const [prompt, setPrompt] = useState('')
  const { isListening, transcript, startListening, stopListening } = useVoiceInput()
  const { isGenerating, progress, agents, currentCode, generate } = useCodeGeneration()

  const handleSubmit = async () => {
    const text = prompt || transcript
    if (!text.trim()) return
    await generate(text)
  }

  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Essayez maintenant
            </span>
          </h2>
          <p className="text-text-muted text-lg">
            Décrivez votre application et voyez les agents IA à l'œuvre.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-2 mb-8"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt || transcript}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Ex: Crée une application de gestion pour mon restaurant..."
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
        </motion.div>

        {/* Agents */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles size={18} className="text-primary animate-pulse" />
                Agents IA en action
              </h3>
              <span className="text-sm text-text-muted">{progress}%</span>
            </div>
            <div className="h-1 bg-border rounded-full mb-6 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <AgentStatus agents={agents} />
          </motion.div>
        )}

        {/* Résultat */}
        {currentCode && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CodeBlock code={currentCode.code} language={currentCode.language} />
          </motion.div>
        )}
      </div>
    </section>
  )
}