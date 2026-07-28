import { motion } from 'framer-motion'

export default function OrbBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Orbe violet */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: '#7C3AED',
          filter: 'blur(120px)',
          opacity: 0.15,
          top: '15%',
          left: '15%',
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Orbe cyan */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: '#00B4FF',
          filter: 'blur(120px)',
          opacity: 0.12,
          bottom: '15%',
          right: '15%',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
      />

      {/* Orbe rose subtil */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: '#EC4899',
          filter: 'blur(150px)',
          opacity: 0.08,
          top: '50%',
          left: '50%',
        }}
        animate={{
          scale: [1, 1.4, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Grille */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}