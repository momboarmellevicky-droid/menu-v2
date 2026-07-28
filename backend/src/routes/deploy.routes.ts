import { Router } from 'express'
import { authenticateUser } from '../middleware/auth.middleware'
import { deployProject, getDeployments } from '../services/deploy.service'
import { logger } from '../utils/logger'

const router = Router()

router.post('/', authenticateUser, async (req, res) => {
  try {
    const { projectId, platform } = req.body

    if (!projectId || !platform) {
      return res.status(400).json({ error: 'projectId et platform requis' })
    }

    const deployment = await deployProject(projectId, platform)
    res.json(deployment)
  } catch (error) {
    logger.error('Erreur deploy:', error)
    res.status(500).json({ error: 'Erreur déploiement' })
  }
})

router.get('/:projectId', authenticateUser, async (req, res) => {
  try {
    const deployments = await getDeployments(req.params.projectId)
    res.json(deployments)
  } catch (error) {
    logger.error('Erreur get deployments:', error)
    res.status(500).json({ error: 'Erreur récupération déploiements' })
  }
})

export default router