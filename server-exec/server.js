// menu-server-exec — service de compilation côté serveur pour MÉNU.
//
// Remplace la dépendance à Sandpack (bundler distant tiers, sujet à
// TIME_OUT sur les apps lourdes comme la 3D/physique) par un vrai
// environnement Node qui installe les dépendances réelles et compile
// avec esbuild — la même approche que les plateformes de référence
// (Bolt.new, Lovable) : la compilation tourne sur un serveur, pas dans
// le navigateur de l'utilisateur.
//
// Créé le 3 sept 2026.

const express = require('express');
const cors = require('cors');
const esbuild = require('esbuild');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const BUILD_ROOT = path.join(os.tmpdir(), 'menu-builds');
const BUILD_TIMEOUT_MS = 90_000;

// N'autorise que des noms/versions de paquets npm de forme raisonnable —
// empêche l'injection de quoi que ce soit d'inattendu dans package.json ou
// la ligne de commande npm install.
function isSafePackageName(name) {
  return /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*$/i.test(name);
}
function isSafeVersion(v) {
  return /^[\w.\-^~><= ]{1,30}$/.test(v);
}

app.post('/build', async (req, res) => {
  const { files, dependencies = {}, entry = '/App.tsx' } = req.body || {};

  if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
    return res.status(400).json({ error: 'files manquant ou vide' });
  }

  const buildId = crypto.randomUUID();
  const dir = path.join(BUILD_ROOT, buildId);

  try {
    await fs.mkdir(path.join(dir, 'src'), { recursive: true });

    // Écrit chaque fichier du projet tel quel sous src/
    for (const [rawPath, content] of Object.entries(files)) {
      if (typeof content !== 'string') continue;
      const cleanRel = rawPath.replace(/^\/+/, '').replace(/^src\//, '');
      const fullPath = path.join(dir, 'src', cleanRel);
      if (!fullPath.startsWith(path.join(dir, 'src'))) continue; // anti path-traversal
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
    }

    // Dépendances : react/react-dom toujours présentes, plus celles
    // détectées par le frontend (déjà filtrées côté MÉNU), validées ici
    // une seconde fois par sécurité avant d'toucher npm.
    const deps = { react: '18.3.1', 'react-dom': '18.3.1', 'lucide-react': '0.383.0' };
    for (const [name, version] of Object.entries(dependencies)) {
      if (isSafePackageName(name) && isSafeVersion(String(version))) {
        deps[name] = version === 'latest' ? 'latest' : version;
      }
    }

    await fs.writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: 'menu-preview', private: true, dependencies: deps }, null, 2)
    );

    // --ignore-scripts : empêche l'exécution de scripts postinstall
    // arbitraires d'un paquet malveillant — seule vraie surface de risque
    // d'exécuter du code non prévu côté serveur pour ce service.
    await execFileAsync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], {
      cwd: dir,
      timeout: BUILD_TIMEOUT_MS,
    });

    const entryClean = entry.replace(/^\/+/, '').replace(/^src\//, '');
    const entryNoExt = entryClean.replace(/\.(tsx|ts|jsx|js)$/, '');

    // App.tsx généré par MÉNU n'est qu'un composant exporté par défaut — il
    // ne monte rien lui-même dans le DOM. On génère ici le vrai point
    // d'entrée (comme le ferait le index.tsx d'un projet Vite classique)
    // qui importe ce composant et l'affiche dans #root.
    const virtualEntryPath = path.join(dir, 'src', '__menu_entry.tsx');
    await fs.writeFile(
      virtualEntryPath,
      `import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './${entryNoExt}'\ncreateRoot(document.getElementById('root')!).render(<App />)\n`
    );

    const result = await esbuild.build({
      entryPoints: [virtualEntryPath],
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
      jsx: 'automatic',
      loader: { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'jsx' },
      absWorkingDir: dir,
      logLevel: 'silent',
    });

    const bundledCode = result.outputFiles[0].text;

    res.json({ ok: true, code: bundledCode });
  } catch (err) {
    res.status(200).json({
      ok: false,
      error: err && err.stderr ? String(err.stderr).slice(0, 4000) : (err.message || String(err)),
    });
  } finally {
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`menu-server-exec en écoute sur le port ${PORT}`);
});
