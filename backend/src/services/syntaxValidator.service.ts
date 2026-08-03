import { parse } from '@babel/parser'

export interface SyntaxCheckResult {
  valid: boolean
  error?: string
}

// Vérification légère pour le format HTML autonome (pas de parseur JS/TS
// applicable ici) : s'assure que la réponse de l'IA est bien un document
// HTML exploitable, pas du JSON, du texte de refus, ou du vide.
export function checkHtmlValidity(code: string): SyntaxCheckResult {
  const trimmed = (code || '').trim()
  if (!trimmed) {
    return { valid: false, error: 'Réponse vide' }
  }
  const looksLikeHtml = /<!DOCTYPE html>/i.test(trimmed) || /<html[\s>]/i.test(trimmed)
  if (!looksLikeHtml) {
    return { valid: false, error: "La réponse ne contient pas de document HTML valide (balise <html> ou <!DOCTYPE html> absente)" }
  }
  const openTags = (trimmed.match(/<(html|head|body)[\s>]/gi) || []).length
  const closeTags = (trimmed.match(/<\/(html|head|body)>/gi) || []).length
  if (closeTags < openTags) {
    return { valid: false, error: 'Structure HTML incomplète : des balises de fermeture (</html>, </head> ou </body>) semblent manquantes' }
  }
  return { valid: true }
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
