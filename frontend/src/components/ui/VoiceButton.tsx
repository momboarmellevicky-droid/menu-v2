import { motion } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceButtonProps {
  isListening: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export default function VoiceButton({ isListening, onStart, onStop, disabled }: VoiceButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
        isListening
          ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
          : 'bg-primary/20 text-primary border-2 border-primary/50 hover:bg-primary/30'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isListening ? (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-500/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <MicOff size={22} />
        </>
      ) : (
        <Mic size={22} />
      )}
    </motion.button>
  )
}