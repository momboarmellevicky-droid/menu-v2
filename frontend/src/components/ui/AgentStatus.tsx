import { motion } from 'framer-motion'
import { Check, Loader2, AlertCircle } from 'lucide-react'

interface Agent {
  name: string
  status: string
  progress: number
}

interface AgentStatusProps {
  agents: Agent[]
}

export default function AgentStatus({ agents }: AgentStatusProps) {
  return (
    <div className="space-y-3">
      {agents.map((agent, i) => (
        <motion.div
          key={agent.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3"
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            agent.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            agent.status === 'working' ? 'bg-primary/20 text-primary' :
            agent.status === 'error' ? 'bg-red-500/20 text-red-400' :
            'bg-border text-text-muted'
          }`}>
            {agent.status === 'completed' && <Check size={14} />}
            {agent.status === 'working' && <Loader2 size={14} className="animate-spin" />}
            {agent.status === 'error' && <AlertCircle size={14} />}
            {agent.status === 'idle' && <span className="text-xs">{i + 1}</span>}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-medium ${
                agent.status === 'completed' ? 'text-green-400' :
                agent.status === 'working' ? 'text-white' :
                'text-text-muted'
              }`}>
                {agent.name}
              </span>
              <span className="text-xs text-text-muted">{agent.progress}%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  agent.status === 'completed' ? 'bg-green-500' :
                  agent.status === 'working' ? 'bg-gradient-to-r from-secondary to-primary' :
                  agent.status === 'error' ? 'bg-red-500' :
                  'bg-text-muted'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${agent.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
