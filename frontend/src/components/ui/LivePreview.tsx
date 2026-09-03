import { SandpackProvider, SandpackPreview, SandpackConsole } from '@codesandbox/sandpack-react'
import { useState, useMemo } from 'react'
import { Terminal, Eye } from 'lucide-react'

interface LivePreviewProps {
  code: string
  files?: Record<string, string>
  framework?: 'react' | 'html'
}

const TAILWIND_INDEX_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Aperçu</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

const BUILTIN_MODULES = new Set(['react', 'react-dom', 'react/jsx-runtime'])

function normalizeMultiFiles(files: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {}
  for (const [path, content] of Object.entries(files)) {
    const cleanPath = path.replace(/^\/src\//, '/').replace(/^src\//, '/')
    normalized[cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`] = content
  }
  return normalized
}

function buildStubFilesForMissingImports(code: string): Record<string, string> {
  const stubFiles: Record<string, string> = {}
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"](\.\/[^'"]+)['"]/g
  let match: RegExpExecArray | null

  while ((match = importRegex.exec(code)) !== null) {
    const names = match[1].split(',').map(n => n.trim()).filter(Boolean)
    const relPath = match[2]
    if (!relPath.startsWith('./')) continue
    let filePath = '/' + relPath.replace('./', '')
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
      filePath += '.tsx'
    }
    if (stubFiles[filePath]) continue

    const exports = names
      .map(name => {
        const isComponent = /^[A-Z]/.test(name)
        if (!isComponent) {
          return `export const ${name} = (...args: any[]) => args[0]`
        }
        return `export const ${name} = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
)`
      })
      .join('\n\n')

    stubFiles[filePath] = `import React from 'react'\n\n${exports}\n`
  }

  return stubFiles
}

// Versions épinglées pour les dépendances lourdes fréquemment générées
// (three.js pour la 3D, animation, etc.) : laisser Sandpack résoudre
// 'latest' à chaque génération force une requête au registre npm avant de
// pouvoir bundler quoi que ce soit, ce qui dépasse régulièrement le délai
// d'attente de Sandpack ("Couldn't connect to server" / TIME_OUT) sur les
// apps qui importent ces libs volumineuses — confirmé le 1er sept 2026 sur
// un test pinball 3D. Les libs légères restent en 'latest'.
const PINNED_VERSIONS: Record<string, string> = {
  three: '0.160.0',
  '@react-three/fiber': '8.15.0',
  '@react-three/drei': '9.92.0',
  'framer-motion': '11.0.0',
  'matter-js': '0.19.0',
  'cannon-es': '0.20.0',
  gsap: '3.12.5',
  d3: '7.8.5',
  recharts: '2.10.0',
  'chart.js': '4.4.1',
}

function detectNpmDependencies(code: string): Record<string, string> {
  const deps: Record<string, string> = {}
  const importRegex = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'".\/][^'"]*)['"]/g
  let match: RegExpExecArray | null

  while ((match = importRegex.exec(code)) !== null) {
    let pkg = match[1]
    const parts = pkg.split('/')
    pkg = pkg.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
    if (BUILTIN_MODULES.has(pkg)) continue
    deps[pkg] = PINNED_VERSIONS[pkg] || 'latest'
  }

  return deps
}

function buildFallbackHtml(sandboxFiles: Record<string, string>, npmDeps: Record<string, string>): string {
  // Aperçu de secours qui ne dépend d'AUCUN serveur de bundling distant
  // (contrairement à Sandpack) : Babel Standalone transpile TS/JSX
  // directement dans l'iframe, et les librairies externes (three.js,
  // etc.) sont chargées via le CDN esm.sh au lieu d'être "bundlées".
  // Ajouté le 3 sept 2026 après des TIME_OUT répétés de Sandpack sur des
  // apps lourdes (ex: pinball 3D) — solution de repli manuelle en
  // attendant un vrai environnement d'exécution côté serveur.
  const importMapEntries = Object.entries(npmDeps)
    .map(([pkg]) => `"${pkg}": "https://esm.sh/${pkg}"`)
    .join(',\n      ')

  const filesJson = JSON.stringify(sandboxFiles)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
    "lucide-react": "https://esm.sh/lucide-react@0.383.0?external=react",
    ${importMapEntries}
  }
}
</script>
<style>html,body,#root{height:100%;margin:0;background:#0a0a0f;}</style>
</head>
<body>
<div id="root"></div>
<script type="module">
  const files = ${filesJson};
  const blobUrls = {};

  function resolvePath(fromPath, relImport) {
    const base = fromPath.split('/').slice(0, -1);
    const parts = relImport.split('/');
    for (const p of parts) {
      if (p === '.' ) continue;
      if (p === '..') base.pop();
      else base.push(p);
    }
    let joined = base.join('/');
    if (!files[joined] && files[joined + '.tsx']) joined += '.tsx';
    if (!files[joined] && files[joined + '.ts']) joined += '.ts';
    return joined;
  }

  function transpile(path) {
    if (blobUrls[path]) return blobUrls[path];
    let source = files[path] || '';
    // Réécrit les imports relatifs vers les blob URLs déjà transpilées
    source = source.replace(/from\\s+['"](\\.[^'"]+)['"]/g, (m, rel) => {
      const resolved = resolvePath(path, rel);
      const url = transpile(resolved);
      return 'from "' + url + '"';
    });
    const out = Babel.transform(source, {
      presets: ['react', 'typescript'],
      filename: path,
    }).code;
    const blob = new Blob([out], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    blobUrls[path] = url;
    return url;
  }

  (async () => {
    try {
      const entry = files['/App.tsx'] ? '/App.tsx' : Object.keys(files)[0];
      const url = transpile(entry);
      const mod = await import(url);
      const Component = mod.default;
      const ReactDOM = await import('react-dom/client');
      const React = await import('react');
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(Component));
    } catch (e) {
      document.getElementById('root').innerHTML =
        '<div style="color:#f87171;font-family:monospace;padding:20px;white-space:pre-wrap;">' +
        'Erreur aperçu de secours:\\n' + (e && e.message ? e.message : e) + '</div>';
      console.error(e);
    }
  })();
</script>
</body>
</html>`
}

export default function LivePreview({ code, files, framework = 'react' }: LivePreviewProps) {
  if (framework === 'html') {
    const htmlContent = files?.['/index.html'] || code
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg/50">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Eye size={16} />
            Aperçu en direct
          </div>
        </div>
        <iframe
          title="Aperçu HTML"
          srcDoc={htmlContent}
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
          style={{ width: '100%', height: '85vh', minHeight: '600px', border: 'none', background: 'white' }}
        />
      </div>
    )
  }

  return <LivePreviewReact code={code} files={files} />
}

function LivePreviewReact({ code, files }: { code: string; files?: Record<string, string> }) {
  const [showConsole, setShowConsole] = useState(false)
  const [fallbackMode, setFallbackMode] = useState(false)

  const hasMultiFiles = files && Object.keys(files).length > 1

  const sandboxFiles = useMemo(() => {
    if (hasMultiFiles) {
      const normalized = normalizeMultiFiles(files!)
      if (!normalized['/App.tsx']) {
        const firstKey = Object.keys(normalized)[0]
        normalized['/App.tsx'] = normalized[firstKey]
      }
      return normalized
    }
    return { '/App.tsx': code }
  }, [hasMultiFiles, files, code])

  const allCodeConcatenated = useMemo(
    () => Object.values(sandboxFiles).join('\n'),
    [sandboxFiles]
  )

  const stubFiles = useMemo(() => buildStubFilesForMissingImports(allCodeConcatenated), [allCodeConcatenated])
  const npmDeps = useMemo(() => detectNpmDependencies(allCodeConcatenated), [allCodeConcatenated])

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg/50">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Eye size={16} />
          Aperçu en direct
          {hasMultiFiles && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-lg border border-primary/20">
              {Object.keys(files!).length} fichiers
            </span>
          )}
        </div>
        <button
          onClick={() => setShowConsole(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          <Terminal size={14} />
          Console
        </button>
        <button
          onClick={() => setFallbackMode(v => !v)}
          title="À utiliser si l'aperçu affiche 'Couldn't connect to server' / TIME_OUT : bascule vers un moteur d'aperçu qui ne dépend d'aucun serveur distant."
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors ${fallbackMode ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
        >
          ⚡ Aperçu de secours
        </button>
      </div>

      {fallbackMode ? (
        <iframe
          title="Aperçu de secours"
          srcDoc={buildFallbackHtml(sandboxFiles, npmDeps)}
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
          style={{ width: '100%', height: '85vh', minHeight: '600px', border: 'none', background: '#0a0a0f' }}
        />
      ) : (
      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={{
          ...sandboxFiles,
          '/public/index.html': TAILWIND_INDEX_HTML,
          ...stubFiles,
        }}
        customSetup={{
          dependencies: {
            'lucide-react': 'latest',
            ...npmDeps,
          },
        }}
        options={{
          // Délai d'attente porté de 10s (défaut) à 40s : sur mobile, avec un
          // projet multi-fichiers (Full Stack notamment), le bundler distant
          // met parfois plus de 10s à répondre, causant un "TIMEOUT" alors
          // que le code lui-même est correct (30 août 2026, confirmé sur un
          // projet Full Stack à 16 fichiers).
          bundlerTimeOut: 40000,
          recompileMode: 'delayed',
          recompileDelay: 500,
        }}
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={true}
          style={{ height: '85vh', minHeight: '600px' }}
        />
        {showConsole && <SandpackConsole style={{ height: '200px' }} />}
      </SandpackProvider>
      )}
    </div>
  )
    }
