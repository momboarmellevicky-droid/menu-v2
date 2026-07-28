import { motion } from 'framer-motion'

interface LogoProps {
  size?: number
  className?: string
  animated?: boolean
}

export default function Logo({ size = 80, className = '', animated = true }: LogoProps) {
  const Wrapper = animated ? motion.svg : 'svg'
  const wrapperProps = animated
    ? {
        animate: { y: [0, -10, 0] },
        transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
      }
    : {}

  return (
    <Wrapper
      {...wrapperProps}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A0A1A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#13131F" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B4FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="txg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B4FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path d="M50 5L95 90H5L50 5Z" fill="url(#tg)" stroke="url(#sg)" strokeWidth="2" />
      <rect x="20" y="75" width="6" height="6" fill="#00B4FF" />
      <rect x="35" y="83" width="6" height="6" fill="#7C3AED" />
      <rect x="50" y="75" width="6" height="6" fill="#00B4FF" />
      <rect x="65" y="83" width="6" height="6" fill="#7C3AED" />
      <rect x="80" y="75" width="6" height="6" fill="#00B4FF" />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="url(#txg)"
        fontSize="28"
        fontWeight="bold"
        fontFamily="monospace"
      >
        M
      </text>
      <text x="12" y="55" textAnchor="middle" dominantBaseline="middle" fill="#00B4FF" fontSize="18" fontFamily="monospace" opacity="0.8">
        {'{'}
      </text>
      <text x="88" y="55" textAnchor="middle" dominantBaseline="middle" fill="#00B4FF" fontSize="18" fontFamily="monospace" opacity="0.8">
        {'}'}
      </text>
    </Wrapper>
  )
}