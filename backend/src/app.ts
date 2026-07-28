import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { apiLimiter } from './middleware/rateLimit.middleware'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import authRoutes from './routes/auth.routes'
import generateRoutes from './routes/generate.routes'
import projectRoutes from './routes/project.routes'
import marketplaceRoutes from './routes/marketplace.routes'
import deployRoutes from './routes/deploy.routes'
import teamRoutes from './routes/team.routes'

const app = express()

// Sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
    },
  },
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting
app.use('/api/', apiLimiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/generate', generateRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/deploy', deployRoutes)
app.use('/api/team', teamRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// 404
app.use(notFoundHandler)

// Error handling
app.use(errorHandler)

export default app