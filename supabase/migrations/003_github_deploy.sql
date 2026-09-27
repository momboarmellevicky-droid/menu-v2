-- ============================================================
-- Migration 003 : déploiement GitHub
-- ============================================================

-- La colonne "files" (JSONB) manquait dans le schéma alors que le backend
-- l'écrit et la lit depuis generated_codes.insert()/select() : tout export
-- multi-fichiers (React) échouait silencieusement côté colonne inconnue.
ALTER TABLE public.generated_codes
  ADD COLUMN IF NOT EXISTS files JSONB;

-- URL du dépôt GitHub créé pour le projet, une fois poussé.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS github_repo_url TEXT;

-- Autoriser 'github' comme plateforme de déploiement.
ALTER TABLE public.deployments
  DROP CONSTRAINT IF EXISTS deployments_platform_check;

ALTER TABLE public.deployments
  ADD CONSTRAINT deployments_platform_check
  CHECK (platform IN ('web', 'pwa', 'android', 'ios', 'github'));
