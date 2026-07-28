import { supabaseAdmin } from '../config/supabase'
import { logger } from '../utils/logger'
import type { RepairResult } from '../types'

export async function repairCode(
  code: string,
  language: string
): Promise<RepairResult> {
  const errors: string[] = []
  const warnings: string[] = []
  let fixedCode = code

  try {
    // Vérification 1: Imports manquants React
    if ((language === 'tsx' || language === 'jsx') && code.includes('useState')) {
      if (!code.includes('import { useState }') && !code.includes('import React, { useState }')) {
        errors.push("useState utilisé mais non importé")
        fixedCode = `import { useState } from 'react'\n${fixedCode}`
      }
    }

    if ((language === 'tsx' || language === 'jsx') && code.includes('useEffect')) {
      if (!code.includes('import { useEffect }') && !code.includes('import React, { useEffect }')) {
        errors.push("useEffect utilisé mais non importé")
        fixedCode = `import { useEffect } from 'react'\n${fixedCode}`
      }
    }

    // Vérification 2: Export default manquant
    if (!code.includes('export default') && !code.includes('export function')) {
      warnings.push("Aucun export default détecté — ajout d'un export par défaut")
      const componentName = extractComponentName(code) || 'GeneratedComponent'
      fixedCode = `${fixedCode}\n\nexport default ${componentName}`
    }

    // Vérification 3: Types any
    const anyTypes = (code.match(/:\s*any/g) || []).length
    if (anyTypes > 0) {
      warnings.push(`${anyTypes} utilisation(s) de 'any' détectée(s) — remplacer par des types stricts`)
      fixedCode = fixedCode.replace(/:\s*any/g, ': unknown')
    }

    // Vérification 4: Console.log en production
    const consoleLogs = (code.match(/console\.log/g) || []).length
    if (consoleLogs > 0) {
      warnings.push(`${consoleLogs} console.log détecté(s) — supprimer en production`)
    }

    // Vérification 5: Clés uniques dans les listes
    if (code.includes('.map(') && !code.includes('key=')) {
      warnings.push("Liste rendue sans prop 'key' — ajouter des clés uniques")
    }

    // Vérification 6: Images sans alt
    if (code.includes('<img') && !code.includes('alt=')) {
      warnings.push("Images sans attribut alt — ajouter pour l'accessibilité")
    }

    // Vérification 7: Vérification des dépendances
    const missingDeps = checkMissingDependencies(code, language)
    if (missingDeps.length > 0) {
      warnings.push(`Dépendances potentiellement manquantes: ${missingDeps.join(', ')}`)
    }

    // Sauvegarder dans la DB
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
        language,
      })
    }

    logger.info(`Code repair: ${errors.length} erreurs, ${warnings.length} warnings`)

    return {
      fixed: errors.length === 0,
      originalCode: code,
      fixedCode,
      errors,
      warnings,
    }
  } catch (error) {
    logger.error('Erreur code repair:', error)
    return {
      fixed: false,
      originalCode: code,
      fixedCode: code,
      errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
      warnings: [],
    }
  }
}

function extractComponentName(code: string): string | null {
  const match = code.match(/(?:function|const|class)\s+(\w+)/)
  return match?.[1] || null
}

function checkMissingDependencies(code: string, language: string): string[] {
  const deps: string[] = []

  if (code.includes('useForm') && !code.includes('react-hook-form')) deps.push('react-hook-form')
  if (code.includes('zod') && !code.includes('zod')) deps.push('zod')
  if (code.includes('motion') && !code.includes('framer-motion')) deps.push('framer-motion')
  if (code.includes('useQuery') && !code.includes('tanstack')) deps.push('@tanstack/react-query')
  if (code.includes('toast') && !code.includes('sonner')) deps.push('sonner')
  if (code.includes('lucide') && !code.includes('lucide-react')) deps.push('lucide-react')

  return deps
}