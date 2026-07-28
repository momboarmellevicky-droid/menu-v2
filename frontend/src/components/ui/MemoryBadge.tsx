import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

interface MemoryBadgeProps {
  projectName?: string
  memoryCount?: number
}

export default function MemoryBadge({ projectName, memoryCount = 0 }: MemoryBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary"
    >
      <Brain size={14} />
      <span>
        {projectName ? `Mémoire: ${projectName}` : 'MÉNU Memory Engine'}
        {memoryCount > 0 && ` • ${memoryCount} éléments`}
      </span>
    </motion.div>
  )
}