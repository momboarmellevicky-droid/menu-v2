import AnimatedCounter from '../ui/AnimatedCounter'

const stats = [
  { end: 0, prefix: '', suffix: '€', label: 'Pour démarrer', delay: 0 },
  { end: 6, suffix: '', label: 'Agents IA', delay: 200 },
  { end: 30, suffix: '', label: 'Requêtes/min', delay: 400 },
  { end: 100, suffix: '%', label: 'Gratuit', delay: 600 },
]

export default function StatsSection() {
  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <AnimatedCounter key={i} {...stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}