export default function OrbBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: '#7C3AED',
          filter: 'blur(120px)',
          opacity: 0.15,
          top: '15%',
          left: '15%',
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: '#00B4FF',
          filter: 'blur(120px)',
          opacity: 0.12,
          bottom: '15%',
          right: '15%',
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: '#EC4899',
          filter: 'blur(150px)',
          opacity: 0.08,
          top: '50%',
          left: '50%',
        }}
      />
    </div>
  )
}
