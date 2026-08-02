import { SandpackProvider, SandpackPreview, SandpackConsole } from '@codesandbox/sandpack-react'
import { useState, useMemo } from 'react'
import { Terminal, Eye } from 'lucide-react'

interface LivePreviewProps {
  code: string
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

// Génère automatiquement des fichiers de remplacement pour tout import local
// (ex: './components', './Plateau') que l'IA a référencé sans jamais générer.
// Évite le crash "Could not find module" quand le code généré n'est pas
// autonome dans un seul fichier.
function buildStubFilesForMissingImports(code: string): Record<string, string> {
  const stubFiles: Record<string, string> = {}
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"](\.\/[^'"]+)['"]/g
  let match: RegExpExecArray | null

  while ((match = importRegex.exec(code)) !== null) {
    const names = match[1].split(',').map(n => n.trim()).filter(Boolean)
    let relPath = match[2]
    if (!relPath.startsWith('./')) continue
    let filePath = '/' + relPath.replace('./', '')
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
      filePath += '.tsx'
    }
    // Ne pas écraser un fichier déjà généré pour ce chemin
    if (stubFiles[filePath]) continue

    const exports = names
      .map(name => {
        const isComponent = /^[A-Z]/.test(name)
        if (!isComponent) {
          // Probablement une fonction utilitaire ou une constante
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

export default function LivePreview({ code }: LivePreviewProps) {
  const [showConsole, setShowConsole] = useState(false)

  const stubFiles = useMemo(() => buildStubFilesForMissingImports(code), [code])

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg/50">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Eye size={16} />
          Aperçu en direct
        </div>
        <button
          onClick={() => setShowConsole(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          <Terminal size={14} />
          Console
        </button>
      </div>

      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={{
          '/App.tsx': code,
          '/public/index.html': TAILWIND_INDEX_HTML,
          ...stubFiles,
        }}
        customSetup={{
          dependencies: {
            'lucide-react': 'latest',
          },
        }}
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={true}
          style={{ height: '480px' }}
        />
        {showConsole && <SandpackConsole style={{ height: '200px' }} />}
      </SandpackProvider>
    </div>
  )
}
