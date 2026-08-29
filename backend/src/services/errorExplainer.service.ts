export interface ExplainedError {
  title: string
  explanation: string
  suggestion: string
  category: 'quota' | 'config' | 'timeout' | 'validation' | 'network' | 'unknown'
}

export function explainError(rawMessage: string): ExplainedError {
  const msg = rawMessage || ''

  if (/rate limit|429/i.test(msg)) {
    return {
      title: 'Limite de requêtes Claude atteinte',
      explanation:
        "L'API Claude a temporairement refusé la requête car la limite de requêtes par minute a été atteinte.",
      suggestion: 'Patientez une minute puis réessayez.',
      category: 'quota',
    }
  }

  if (/could not resolve authentication|api[_ ]?key|401|unauthorized/i.test(msg)) {
    return {
      title: 'Clé API Claude manquante ou invalide',
      explanation:
        "ANTHROPIC_API_KEY est absente, incorrecte, ou le crédit du compte Anthropic est épuisé.",
      suggestion:
        'Vérifiez la variable ANTHROPIC_API_KEY dans Environment sur Render, et le solde de crédit sur console.anthropic.com.',
      category: 'config',
    }
  }

  if (/model.*not[_ ]?found|404/i.test(msg)) {
    return {
      title: 'Modèle Claude introuvable',
      explanation:
        "Le nom du modèle configuré dans AI_CONFIG.defaultModel n'existe pas ou plus pour cette clé d'API.",
      suggestion:
        'Vérifiez AI_CONFIG.defaultModel dans backend/src/config/openai.ts contre la liste des modèles actifs sur docs.claude.com.',
      category: 'config',
    }
  }

  if (/timeout insertion supabase/i.test(msg)) {
    return {
      title: 'Base de données trop lente à répondre',
      explanation:
        "L'enregistrement du résultat dans la base de données Supabase a pris plus de 15 secondes et a été annulé automatiquement pour éviter un blocage.",
      suggestion:
        'Réessayez. Si le problème persiste, vérifiez le statut de votre projet Supabase (il peut être en pause sur le plan gratuit après inactivité).',
      category: 'timeout',
    }
  }

  if (/crédits insuffisants/i.test(msg)) {
    return {
      title: 'Crédits insuffisants',
      explanation: "Le compte n'a plus assez de crédits pour ce type de génération.",
      suggestion: 'Consultez la page Tarifs pour passer à un plan supérieur, ou attendez le renouvellement mensuel.',
      category: 'validation',
    }
  }

  if (/erreur de syntaxe non corrigeable/i.test(msg)) {
    return {
      title: 'Erreur de syntaxe non corrigeable automatiquement',
      explanation:
        "Claude a généré du code contenant une erreur de syntaxe, et la tentative automatique de correction a également échoué.",
      suggestion:
        "Relancez la génération avec un prompt légèrement reformulé — une nouvelle tentative aboutit presque toujours à un résultat correct.",
      category: 'validation',
    }
  }

  if (/erreur développeur|erreur analyste/i.test(msg)) {
    return {
      title: "Claude n'a pas pu produire de résultat à cette étape",
      explanation: msg,
      suggestion:
        'Réessayez avec un prompt légèrement reformulé. Si le problème persiste, consultez les logs backend sur Render pour le détail technique exact renvoyé par Claude.',
      category: 'unknown',
    }
  }

  if (/fetch failed|network|econnrefused|enotfound/i.test(msg)) {
    return {
      title: 'Problème de connexion réseau',
      explanation: "Le backend n'a pas réussi à joindre un service externe nécessaire à la génération.",
      suggestion: 'Réessayez dans un instant. Si le problème persiste, vérifiez le statut du service concerné.',
      category: 'network',
    }
  }

  return {
    title: 'Erreur inattendue',
    explanation: msg || "Une erreur s'est produite sans message détaillé disponible.",
    suggestion: 'Réessayez. Si le problème persiste, consultez les logs backend sur Render pour plus de détails.',
    category: 'unknown',
  }
}
