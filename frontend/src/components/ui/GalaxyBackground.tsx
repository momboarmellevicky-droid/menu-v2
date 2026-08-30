import { useRef } from 'react'

interface Star {
  id: number
  top: number
  left: number
  size: number
  delay: number
  duration: number
  opacity: number
}

interface ShootingStar {
  id: number
  top: number
  left: number
  delay: number
  duration: number
  angle: number
}

export default function GalaxyBackground() {
  const stars = useRef<Star[]>(
    Array.from({ length: 180 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2.2 + 0.6,
      delay: Math.random() * 6,
      duration: Math.random() * 3 + 2.5,
      opacity: Math.random() * 0.6 + 0.3,
    }))
  ).current

  const shootingStars = useRef<ShootingStar[]>(
    Array.from({ length: 3 }, (_, i) => ({
      id: i,
      top: Math.random() * 40,
      left: Math.random() * 60,
      delay: i * 6 + Math.random() * 4,
      duration: 1.6,
      angle: 20 + Math.random() * 15,
    }))
  ).current

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0B1330 0%, #050814 55%, #020308 100%)' }}
      aria-hidden="true"
    >
      {/* Nébuleuses profondes */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #1E3A8A 0%, transparent 70%)',
          filter: 'blur(140px)',
          opacity: 0.35,
          top: '-10%',
          left: '5%',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)',
          filter: 'blur(150px)',
          opacity: 0.18,
          bottom: '5%',
          right: '0%',
        }}
      />
      <div
        className="absolute w-[450px] h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #6D28D9 0%, transparent 70%)',
          filter: 'blur(160px)',
          opacity: 0.15,
          top: '40%',
          left: '55%',
        }}
      />

      {/* Étoiles scintillantes */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            boxShadow: star.size > 1.8 ? '0 0 4px 1px rgba(255,255,255,0.5)' : 'none',
            animation: `menu-star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      {/* Étoiles filantes occasionnelles */}
      {shootingStars.map((s) => (
        <div
          key={s.id}
          className="absolute"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: '2px',
            height: '2px',
            background: 'transparent',
            animation: `menu-shooting-star ${s.duration}s linear ${s.delay}s infinite`,
            transformOrigin: 'left center',
          }}
        >
          <div
            style={{
              width: '90px',
              height: '2px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.9), transparent)',
              transform: `rotate(${s.angle}deg)`,
            }}
          />
        </div>
      ))}

      {/* Vignette pour la profondeur */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(2,3,8,0.6) 100%)',
        }}
      />

      <style>{`
        @keyframes menu-star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes menu-shooting-star {
          0% { opacity: 0; transform: translateX(0); }
          5% { opacity: 1; }
          20% { opacity: 0; transform: translateX(220px); }
          100% { opacity: 0; transform: translateX(220px); }
        }
      `}</style>
    </div>
  )
}
