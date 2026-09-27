import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'

const GITHUB_API = 'https://api.github.com'

interface GithubPushResult {
  url: string
  logs: string
}

export async function deployToGithub(projectId: string): Promise<GithubPushResult> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_USERNAME

  if (!token || !owner) {
    throw new Error(
      "Déploiement GitHub impossible : GITHUB_TOKEN et/ou GITHUB_USERNAME absents des variables d'environnement backend."
    )
  }

  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('name, description')
    .eq('id', projectId)
    .single()
  if (projectError) throw projectError

  const { data: codeRows, error: codeError } = await supabaseAdmin
    .from('generated_codes')
    .select('code, files, framework, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (codeError) throw codeError
  if (!codeRows || codeRows.length === 0) {
    throw new Error('Aucun code généré trouvé pour ce projet. Générez du code avant de pousser sur GitHub.')
  }

  const frontendRow = codeRows.find((r: any) => r.framework === 'react' || r.framework === 'html')
  const backendRow = codeRows.find((r: any) => r.framework === 'node')
  const databaseRow = codeRows.find((r: any) => r.framework === 'postgresql')

  if (!frontendRow) {
    throw new Error('Aucun code frontend trouvé pour ce projet.')
  }

  const hasBackend = !!backendRow
  const files: Record<string, string> = {}

  const hasMultiFiles =
    frontendRow.files && typeof frontendRow.files === 'object' && Object.keys(frontendRow.files).length > 0

  if (hasMultiFiles) {
    for (const [path, content] of Object.entries(frontendRow.files as Record<string, string>)) {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      files[hasBackend ? `frontend/${cleanPath}` : cleanPath] = content
    }
  } else {
    files[hasBackend ? 'frontend/index.html' : 'index.html'] = frontendRow.code
  }

  if (backendRow) {
    files['backend/server.ts'] = backendRow.code
  }
  if (databaseRow) {
    files['database/schema.sql'] = databaseRow.code
  }

  files['README.md'] = buildReadme(project?.name || 'Projet MÉNU', project?.description || '', hasBackend, !!databaseRow)

  const repoName = slugify(project?.name || `menu-projet-${projectId.slice(0, 8)}`)
  const repoFullName = `${owner}/${repoName}`
  let defaultBranch = 'main'

  const createRes = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers: githubHeaders(token),
    body: JSON.stringify({
      name: repoName,
      description: (project?.description || 'Projet généré par MÉNU').slice(0, 350),
      private: false,
      auto_init: true,
    }),
  })

  if (createRes.status === 201) {
    const created: any = await createRes.json()
    defaultBranch = created.default_branch || 'main'
    // Laisser GitHub finir l'auto_init (commit initial) avant de committer par-dessus
    await new Promise(r => setTimeout(r, 1500))
  } else if (createRes.status === 422) {
    const existingRes = await fetch(`${GITHUB_API}/repos/${repoFullName}`, { headers: githubHeaders(token) })
    if (!existingRes.ok) {
      throw new Error(`Le dépôt ${repoFullName} existe déjà mais est inaccessible avec ce token.`)
    }
    const existing: any = await existingRes.json()
    defaultBranch = existing.default_branch || 'main'
  } else {
    const err: any = await createRes.json().catch(() => ({}))
    throw new Error(`Création du dépôt GitHub échouée : ${err.message || createRes.status}`)
  }

  let pushedCount = 0
  for (const [path, content] of Object.entries(files)) {
    await pushFile(token, repoFullName, defaultBranch, path, content)
    pushedCount++
  }

  const url = `https://github.com/${repoFullName}`

  await supabaseAdmin.from('projects').update({ github_repo_url: url }).eq('id', projectId)

  logger.info(`Dépôt GitHub créé/mis à jour pour projet ${projectId}: ${url} (${pushedCount} fichiers)`)

  return {
    url,
    logs: `Dépôt GitHub prêt : ${url}\n${pushedCount} fichier(s) poussé(s) sur la branche ${defaultBranch}.`,
  }
}

async function pushFile(token: string, repoFullName: string, branch: string, path: string, content: string) {
  let sha: string | undefined
  const existingRes = await fetch(
    `${GITHUB_API}/repos/${repoFullName}/contents/${encodeURIComponent(path)}?ref=${branch}`,
    { headers: githubHeaders(token) }
  )
  if (existingRes.ok) {
    const existing: any = await existingRes.json()
    sha = existing.sha
  }

  const putRes = await fetch(`${GITHUB_API}/repos/${repoFullName}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: githubHeaders(token),
    body: JSON.stringify({
      message: sha ? `MÉNU: mise à jour de ${path}` : `MÉNU: ajout de ${path}`,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!putRes.ok) {
    const err: any = await putRes.json().catch(() => ({}))
    throw new Error(`Échec de l'envoi du fichier ${path} : ${err.message || putRes.status}`)
  }
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'projet-menu'
  )
}

function buildReadme(name: string, description: string, hasBackend: boolean, hasDatabase: boolean): string {
  const structure = [
    hasBackend ? '- `frontend/` — application React/Vite/TypeScript' : '- Code frontend à la racine',
    hasBackend ? '- `backend/server.ts` — API Node/Express/TypeScript' : '',
    hasDatabase ? '- `database/schema.sql` — schéma PostgreSQL' : '',
  ]
    .filter(Boolean)
    .join('\n')

  const start = hasBackend
    ? '```bash\ncd frontend\nnpm install\nnpm run dev\n```\n\nPour le backend :\n\n```bash\ncd backend\nnpm install\nnpm run dev\n```'
    : '```bash\nnpm install\nnpm run dev\n```'

  return `# ${name}\n\n${description}\n\nGénéré par MÉNU — plateforme IA multi-agents.\n\n## Structure\n\n${structure}\n\n## Démarrage\n\n${start}\n`
}
