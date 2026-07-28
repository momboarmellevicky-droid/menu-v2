import { ReactNode } from 'react'

interface GradientTextProps {
  children: ReactNode
  className?: string
}

export default function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span className={`bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  )
}