import { useState, useCallback, useRef } from 'react'

interface UseVoiceInputReturn {
  isListening: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("La reconnaissance vocale n'est pas supportée par votre navigateur")
      return
    }

    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setError("La reconnaissance vocale n'est pas supportée par votre navigateur")
      return
    }
    const recognition = new SpeechRecognitionCtor()

    setTranscript('')

    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        setTranscript(prev => (prev ? prev + ' ' : '') + finalTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Erreur: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return { isListening, transcript, error, startListening, stopListening, resetTranscript }
}
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
                <h3 className="font-semibold text-lg">Code généré</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-lg border border-primary/20">
                    {currentCode.framework}
                  </span>
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg border border-green-500/20">
                    Vérifié
                  </span>
                </div>
              </div>
              <CodeBlock 
                code={currentCode.code} 
                language={currentCode.language} 
                filename={`component.${currentCode.language}`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
                  }
