import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import type { Deployment } from '../types'

const VERCEL_API = 'https://api.vercel.com'

export async function deployProject(
  projectId: string,
  platform: 'web' | 'pwa' | 'android' | 'ios'
): Promise<Deployment> {
  const { data: deployment, error } = await supabaseAdmin
    .from('deployments')
    .insert({
      project_id: projectId,
      platform,
      status: 'building',
    })
    .select()
    .single()

  if (error) throw error

  try {
    const buildResult = platform === 'web' || platform === 'pwa'
      ? await deployToVercel(projectId, platform)
      : await deployToExpo(projectId, platform)

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('deployments')
      .update({
        status: 'deployed',
        url: buildResult.url,
        build_logs: buildResult.logs,
        deployed_at: new Date().toISOString(),
      })
      .eq('id', deployment.id)
      .select()
      .single()

    if (updateError) throw updateError

    logger.info(`Déploiement ${platform} pour projet ${projectId}: succès (${buildResult.url})`)
    return updated
  } catch (buildError: any) {
    // Échec réel du build : on ne renvoie jamais une URL inventée, on marque l'échec
    // et on renvoie le vrai message d'erreur pour que l'utilisateur sache quoi corriger.
    await supabaseAdmin
      .from('deployments')
      .update({
        status: 'error',
        build_logs: buildError.message || 'Erreur de déploiement inconnue',
      })
      .eq('id', deployment.id)

    logger.error(`Échec déploiement ${platform} pour projet ${projectId}:`, buildError)
    throw buildError
  }
}

/**
 * Déploiement RÉEL sur Vercel via leur API officielle (v13/deployments).
 * Le composant React généré est packagé en une page HTML statique autonome
 * (React + ReactDOM + Babel standalone via CDN, transformation JSX dans le
 * navigateur) : pas d'étape de build npm côté Vercel nécessaire, donc pas de
 * risque d'échec de build sur du code généré par IA potentiellement instable.
 */
async function deployToVercel(
  projectId: string,
  platform: 'web' | 'pwa'
): Promise<{ url: string; logs: string }> {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    throw new Error('Déploiement Vercel impossible : VERCEL_TOKEN absent des variables d\'environnement backend.')
  }

  const { data: codeRow, error: codeError } = await supabaseAdmin
    .from('generated_codes')
    .select('code, prompt')
    .eq('project_id', projectId)
    .eq('framework', 'react')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (codeError) throw codeError
  if (!codeRow) {
    throw new Error('Aucun code généré trouvé pour ce projet. Générez du code avant de déployer.')
  }

  const title = (codeRow.prompt || 'Application MÉNU').slice(0, 60)
  const html = buildStaticHtml(codeRow.code, title, platform === 'pwa')
  const files: { file: string; data: string }[] = [
    { file: 'index.html', data: html },
  ]
  if (platform === 'pwa') {
    files.push({ file: 'manifest.json', data: buildManifest(title) })
  }

  const projectName = `menu-${projectId.slice(0, 8)}`

  const response = await fetch(`${VERCEL_API}/v13/deployments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      files,
      target: 'production',
      projectSettings: { framework: null },
    }),
  })

  const result: any = await response.json()

  if (!response.ok) {
    const message = result?.error?.message || `Erreur Vercel HTTP ${response.status}`
    throw new Error(`Déploiement Vercel échoué : ${message}`)
  }

  const url = result.url ? `https://${result.url}` : `https://${projectName}.vercel.app`

  return {
    url,
    logs: `Déploiement Vercel réussi.\nDeployment ID: ${result.id}\nURL: ${url}`,
  }
}

/**
 * Le build mobile réel (Expo/EAS) nécessite un compte Expo, un token EAS et
 * potentiellement des comptes développeur Apple/Google — pas encore configuré.
 * On échoue explicitement au lieu de renvoyer une fausse URL TestFlight/Expo,
 * pour ne jamais induire l'utilisateur en erreur sur ce qui est réellement livré.
 */
async function deployToExpo(
  _projectId: string,
  platform: 'android' | 'ios'
): Promise<{ url: string; logs: string }> {
  throw new Error(
    `Déploiement ${platform === 'android' ? 'Android' : 'iOS'} pas encore implémenté : nécessite un compte Expo/EAS configuré (EAS_TOKEN). Le déploiement Web/PWA via Vercel est disponible.`
  )
}

function buildManifest(title: string): string {
  return JSON.stringify({
    name: title,
    short_name: title.slice(0, 20),
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0F',
    theme_color: '#0066FF',
  }, null, 2)
}

function buildStaticHtml(componentCode: string, title: string, isPwa: boolean): string {
  // Le code généré exporte un composant par défaut ("export default function X").
  // On le transforme en variable globale que Babel standalone compile côté client,
  // puis on le monte directement dans #root.
  const cleanedCode = componentCode.replace(/export\s+default\s+/, 'window.GeneratedComponent = ')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  ${isPwa ? '<link rel="manifest" href="/manifest.json" />' : ''}
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
${cleanedCode}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<window.GeneratedComponent />);
  </script>
  <footer style="text-align:center;padding:12px;font-family:monospace;font-size:11px;color:#888;">
    Généré et déployé par MÉNU v2.0
  </footer>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function getDeployments(projectId: string): Promise<Deployment[]> {
  const { data, error } = await supabaseAdmin
    .from('deployments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
