import { useEffect, useState, useRef } from 'react'

interface UseCountUpOptions {
  duration?: number
  delay?: number
  easing?: 'linear' | 'easeOut' | 'easeInOut'
}

export function useCountUp(
  end: number,
  start: boolean = false,
  options: UseCountUpOptions = {}
) {
  const { duration = 2000, delay = 0, easing = 'easeOut' } = options
  const [count, setCount] = useState(0)
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  const easeFn = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  }

  useEffect(() => {
    if (!start) {
      setCount(0)
      return
    }

    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeFn[easing](progress)

        setCount(Math.floor(eased * end))

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate)
        } else {
          setCount(end)
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frameRef.current)
      startTimeRef.current = 0
    }
  }, [start, end, duration, delay, easing])

  return count
}