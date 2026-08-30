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

function detectNpmDependencies(code: string): Record<string, string> {
  const deps: Record<string, string> = {}
  const importRegex = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'".\/][^'"]*)['"]/g
  let match: RegExpExecArray | null

  while ((match = importRegex.exec(code)) !== null) {
    let pkg = match[1]
    const parts = pkg.split('/')
    pkg = pkg.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
    if (BUILTIN_MODULES.has(pkg)) continue
    deps[pkg] = 'latest'
  }

  return deps
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
      </div>

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
    </div>
  )
    }
