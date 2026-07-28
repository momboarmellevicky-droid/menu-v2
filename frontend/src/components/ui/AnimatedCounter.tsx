import { useInView } from '../../hooks/useInView'
import { useCountUp } from '../../hooks/useCountUp'

interface AnimatedCounterProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  delay?: number
  label: string
  className?: string
}

export default function AnimatedCounter({
  end,
  suffix = '',
  prefix = '',
  duration = 2000,
  delay = 0,
  label,
  className = '',
}: AnimatedCounterProps) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  const count = useCountUp(end, isInView, { duration, delay })

  return (
    <div ref={ref} className={`text-center ${className}`}>
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent tabular-nums">
        {prefix}{count}{suffix}
      </div>
      <div className="text-sm text-text-muted mt-2 font-medium">{label}</div>
    </div>
  )
}