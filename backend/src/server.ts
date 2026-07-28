import app from './app'
import dotenv from 'dotenv'
import { logger } from './utils/logger'

dotenv.config()

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  logger.info(`🚀 MÉNU Backend v2.0 démarré sur le port ${PORT}`)
  logger.info(`📊 Health check: http://localhost:${PORT}/health`)
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err)
})

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})