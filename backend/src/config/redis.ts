import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL || '', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
})

redis.on('connect', () => {
  console.log('✅ Redis connecté')
})

redis.on('error', (err) => {
  console.error('❌ Erreur Redis:', err.message)
})

// Cache helpers
export const cache = {
  async get(key: string): Promise<string | null> {
    return redis.get(key)
  },

  async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, value)
  },

  async del(key: string): Promise<void> {
    await redis.del(key)
  },

  async generateKey(prompt: string, framework: string): Promise<string> {
    const crypto = await import('crypto')
    const hash = crypto.createHash('md5').update(`${prompt}:${framework}`).digest('hex')
    return `cache:code:${hash}`
  }
}