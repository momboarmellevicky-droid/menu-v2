import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Download } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export default function CodeBlock({ code, language = 'tsx', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `component.${language}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Barre d'outils */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          {filename && (
            <span className="ml-3 text-xs text-text-muted font-mono">{filename}</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-muted hover:text-white"
            title="Copier"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-muted hover:text-white"
            title="Télécharger"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed">
          <code className="text-blue-300">{code}</code>
        </pre>
      </div>
    </motion.div>
  )
}