import { parse } from '@babel/parser'

export interface SyntaxCheckResult {
  valid: boolean
  error?: string
}

// Vérifie RÉELLEMENT que le code généré est syntaxiquement valide, en le
// parsant avec le même moteur que Babel (TypeScript + JSX). Contrairement
// à codeRepair.service.ts qui ne cherche que des motifs connus (imports
// manquants, 'any', etc.), ceci attrape toute erreur de syntaxe, quelle
// qu'elle soit — la seule façon fiable de ne jamais livrer de code cassé.
export function checkSyntax(code: string): SyntaxCheckResult {
  try {
    parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: false,
    })
    return { valid: true }
  } catch (error: any) {
    const message = error?.message || 'Erreur de syntaxe inconnue'
    return { valid: false, error: message }
  }
}
