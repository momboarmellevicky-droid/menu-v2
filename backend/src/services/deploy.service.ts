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
    .select('code, files, prompt')
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
  const projectName = `menu-${projectId.slice(0, 8)}`
  const hasMultiFiles = codeRow.files && typeof codeRow.files === 'object' && Object.keys(codeRow.files).length > 0

  const files: { file: string; data: string }[] = hasMultiFiles
    ? buildViteProjectFiles(codeRow.files as Record<string, string>)
    : [{ file: 'index.html', data: buildStaticHtml(codeRow.code, title, platform === 'pwa') }]

  if (!hasMultiFiles && platform === 'pwa') {
    files.push({ file: 'manifest.json', data: buildManifest(title) })
  }

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
      projectSettings: hasMultiFiles ? { framework: 'vite' } : { framework: null },
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
    logs: `Déploiement Vercel réussi (${hasMultiFiles ? 'projet multi-fichiers' : 'fichier unique'}).\nDeployment ID: ${result.id}\nURL: ${url}`,
  }
}

function buildViteProjectFiles(sourceFiles: Record<string, string>): { file: string; data: string }[] {
  const files: { file: string; data: string }[] = []

  for (const [path, content] of Object.entries(sourceFiles)) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    files.push({ file: cleanPath, data: content })
  }

  files.push({
    file: 'package.json',
    data: JSON.stringify(
      {
        name: 'menu-generated-app',
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
          'lucide-react': '^0.400.0',
        },
        devDependencies: {
          '@types/react': '^18.3.0',
          '@types/react-dom': '^18.3.0',
          '@vitejs/plugin-react': '^4.3.0',
          autoprefixer: '^10.4.19',
          postcss: '^8.4.38',
          tailwindcss: '^3.4.4',
          typescript: '^5.5.0',
          vite: '^5.3.0',
        },
      },
      null,
      2
    ),
  })

  files.push({
    file: 'vite.config.ts',
    data: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})\n`,
  })

  files.push({
    file: 'tailwind.config.js',
    data: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n}\n`,
  })

  files.push({
    file: 'postcss.config.js',
    data: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n`,
  })

  files.push({
    file: 'index.html',
    data: `<!DOCTYPE html>\n<html lang="fr">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Application MÉNU</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
  })

  files.push({
    file: 'src/main.tsx',
    data: `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n)\n`,
  })

  files.push({
    file: 'src/index.css',
    data: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
  })

  return files
}

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
