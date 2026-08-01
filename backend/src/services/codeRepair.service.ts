import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import type { RepairResult, DiagnosticEntry } from '../types'

export async function repairCode(
  code: string,
  language: string
): Promise<RepairResult> {
  const diagnostics: DiagnosticEntry[] = []
  let fixedCode = code
  let counter = 0
  const nextId = () => `diag-${++counter}`

  try {
    if ((language === 'tsx' || language === 'jsx') && code.includes('useState')) {
      if (!code.includes('import { useState }') && !code.includes('import React, { useState }')) {
        diagnostics.push({
          id: nextId(),
          service: 'codeRepair.service.ts',
          location: 'ligne 1 (imports)',
          category: 'quality',
          severity: 'critical',
          description: "useState est utilisé dans le composant mais n'est pas importé depuis react",
          recommendation: "Ajouter l'import manquant en haut du fichier",
          autoFixed: true,
        })
        fixedCode = `import { useState } from 'react'\n${fixedCode}`
      }
    }

    if ((language === 'tsx' || language === 'jsx') && code.includes('useEffect')) {
      if (!code.includes('import { useEffect }') && !code.includes('import React, { useEffect }')) {
        diagnostics.push({
          id: nextId(),
          service: 'codeRepair.service.ts',
          location: 'ligne 1 (imports)',
          category: 'quality',
          severity: 'critical',
          description: "useEffect est utilisé dans le composant mais n'est pas importé depuis react",
          recommendation: "Ajouter l'import manquant en haut du fichier",
          autoFixed: true,
        })
        fixedCode = `import { useEffect } from 'react'\n${fixedCode}`
      }
    }

    if (!code.includes('export default') && !code.includes('export function')) {
      const componentName = extractComponentName(code) || 'GeneratedComponent'
      diagnostics.push({
        id: nextId(),
        service: 'codeRepair.service.ts',
        location: `fin de fichier (composant: ${componentName})`,
        category: 'quality',
        severity: 'warning',
        description: 'Aucun export default détecté dans le composant généré',
        recommendation: `Export ajouté automatiquement pour ${componentName}`,
        autoFixed: true,
      })
      fixedCode = `${fixedCode}\n\nexport default ${componentName}`
    }

    const anyMatches = [...code.matchAll(/:\s*any/g)]
    if (anyMatches.length > 0) {
      diagnostics.push({
        id: nextId(),
        service: 'codeRepair.service.ts',
        location: `${anyMatches.length} occurrence(s) — type 'any'`,
        category: 'quality',
        severity: 'warning',
        description: `${anyMatches.length} utilisation(s) du type 'any', ce qui désactive la vérification TypeScript`,
        recommendation: "Remplacer par des types stricts spécifiques au domaine",
        autoFixed: true,
      })
      fixedCode = fixedCode.replace(/:\s*any/g, ': unknown')
    }

    const consoleMatches = [...code.matchAll(/console\.log/g)]
    if (consoleMatches.length > 0) {
      diagnostics.push({
        id: nextId(),
        service: 'codeRepair.service.ts',
        location: `${consoleMatches.length} occurrence(s) — console.log`,
        category: 'quality',
        severity: 'info',
        description: `${consoleMatches.length} appel(s) console.log laissés dans le code`,
        recommendation: 'Retirer avant mise en production (fuite potentielle de données en console)',
        autoFixed: false,
      })
    }

    if (code.includes('.map(') && !code.includes('key=')) {
      diagnostics.push({
        id: nextId(),
        service: 'codeRepair.service.ts',
        location: "bloc .map() sans prop 'key'",
        category: 'quality',
        severity: 'warning',
        description: "Une liste est générée avec .map() sans prop 'key' unique",
        recommendation: 'Ajouter une clé unique (id ou index) à chaque élément généré',
        autoFixed: false,
      })
    }

    if (code.includes('<img') && !code.includes('alt=')) {
      diagnostics.push({
        id: nextId(),
        service: 'codeRepair.service.ts',
        location: 'balise <img>',
        category: 'accessibility',
        severity: 'warning',
        description: "Image sans attribut alt, non conforme à l'accessibilité",
        recommendation: "Ajouter un attribut alt descriptif à chaque <img>",
        autoFixed: false,
      })
    }

    const missingDeps = checkMissingDependencies(code)
    if (missingDeps.length > 0) {
      diagnostics.push({
        id: nextId(),
        service: 'codeRepair.service.ts',
        location: 'package.json (dépendances)',
        category: 'dependency',
        severity: 'critical',
        description: `Dépendances utilisées dans le code mais absentes du projet: ${missingDeps.join(', ')}`,
        recommendation: `Installer via npm install ${missingDeps.join(' ')}`,
        autoFixed: false,
      })
    }

    if (/dangerouslySetInnerHTML/.test(code)) {
      diagnostics.push({
        id: nextId(),
        service: 'codeRepair.service.ts',
        location: 'dangerouslySetInnerHTML',
        category: 'security',
        severity: 'critical',
        description: 'Utilisation de dangerouslySetInnerHTML, risque de faille XSS si le contenu vient de l\'utilisateur',
        recommendation: 'Vérifier que le contenu inséré est assaini (sanitize) avant affichage',
        autoFixed: false,
      })
    }

    if (/eval\s*\(/.test(code)) {
      diagnostics.push({
        id: nextId(),
        service: 'codeRepair.service.ts',
        location: 'eval()',
        category: 'security',
        severity: 'critical',
        description: "Utilisation de eval(), risque d'exécution de code arbitraire",
        recommendation: 'Retirer eval() et utiliser une alternative sûre',
        autoFixed: false,
      })
    }

    const errors = diagnostics.filter(d => d.severity === 'critical').map(d => d.description)
    const warnings = diagnostics.filter(d => d.severity === 'warning').map(d => d.description)

    const { data: codeRecord } = await supabaseAdmin
      .from('generated_codes')
      .insert({
        prompt: 'Code repair auto',
        code: fixedCode,
        language,
        framework: language === 'tsx' ? 'react' : language,
      })
      .select('id')
      .single()

    if (codeRecord) {
      await supabaseAdmin.from('code_repairs').insert({
        code_id: codeRecord.id,
        original_code: code,
        fixed_code: fixedCode,
        errors,
        warnings,
        diagnostics,
        language,
      })
    }

    logger.info(`Code repair: ${diagnostics.length} faille(s) détectée(s)`)

    return {
      fixed: errors.length === 0,
      originalCode: code,
      fixedCode,
      errors,
      warnings,
      diagnostics,
    }
  } catch (error) {
    logger.error('Erreur code repair:', error)
    return {
      fixed: false,
      originalCode: code,
      fixedCode: code,
      errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
      warnings: [],
      diagnostics: [],
    }
  }
}

function extractComponentName(code: string): string | null {
  const match = code.match(/(?:function|const|class)\s+(\w+)/)
  return match?.[1] || null
}

function checkMissingDependencies(code: string): string[] {
  const deps: string[] = []

  if (code.includes('useForm') && !code.includes('react-hook-form')) deps.push('react-hook-form')
  if (code.includes('motion') && !code.includes('framer-motion')) deps.push('framer-motion')
  if (code.includes('useQuery') && !code.includes('tanstack')) deps.push('@tanstack/react-query')
  if (code.includes('toast') && !code.includes('sonner')) deps.push('sonner')
  if (code.includes('lucide') && !code.includes('lucide-react')) deps.push('lucide-react')

  return deps
        }
