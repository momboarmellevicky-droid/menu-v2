import { SandpackProvider, SandpackPreview, SandpackConsole } from '@codesandbox/sandpack-react'
import { useState } from 'react'
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

export default function LivePreview({ code }: LivePreviewProps) {
  const [showConsole, setShowConsole] = useState(false)

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
