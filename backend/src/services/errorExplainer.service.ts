export interface ExplainedError {
  title: string
  explanation: string
  suggestion: string
  category: 'quota' | 'config' | 'timeout' | 'validation' | 'network' | 'unknown'
}

export function explainError(rawMessage: string): ExplainedError {
  const msg = rawMessage || ''

  if (/rate limit|429/i.test(msg) && /groq|llama/i.test(msg)) {
    return {
      title: 'Quota Groq journalier atteint',
      explanation:
        "Le fournisseur IA de secours (Groq) a atteint sa limite gratuite de tokens pour aujourd'hui. C'est un plafond imposé par Groq, pas un bug de MÉNU.",
      suggestion:
        'Réessayez dans quelques heures (le quota se réinitialise chaque jour), ou passez au plan payant Groq Dev Tier pour lever la limite.',
      category: 'quota',
    }
  }

  if (/could not resolve authentication|api[_ ]?key/i.test(msg)) {
    return {
      title: 'Clé API manquante ou invalide',
      explanation:
        "Un des fournisseurs d'intelligence artificielle (Claude, Groq ou Gemini) n'a pas reçu de clé d'API valide pour traiter cette demande.",
      suggestion:
        "Vérifiez que les variables d'environnement ANTHROPIC_API_KEY, GROQ_API_KEY et GEMINI_API_KEY sont bien renseignées sur Render, puis relancez.",
      category: 'config',
    }
  }

  if (/gemini non configuré/i.test(msg)) {
    return {
      title: 'Gemini non configuré',
      explanation: "La clé GEMINI_API_KEY est absente, donc le second filet de secours n'a pas pu être utilisé.",
      suggestion: 'Ajoutez GEMINI_API_KEY dans les variables d\'environnement du backend sur Render.',
      category: 'config',
    }
  }

  if (/models\/gemini.*not found|404 not found/i.test(msg)) {
    return {
      title: 'Modèle Gemini introuvable',
      explanation:
        "Le nom du modèle Gemini configuré n'existe plus ou n'est pas disponible pour cette clé d'API.",
      suggestion:
        "Mettez à jour AI_CONFIG.geminiModel dans backend/src/config/openai.ts vers un modèle actuellement supporté (ex: gemini-2.5-flash).",
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

  if (/erreur développeur|erreur analyste/i.test(msg)) {
    return {
      title: "Les agents IA n'ont pas pu produire de résultat",
      explanation:
        "Tous les fournisseurs d'intelligence artificielle disponibles (Claude, Groq, Gemini) ont échoué à traiter cette demande à cette étape précise du pipeline.",
      suggestion:
        'Réessayez avec un prompt légèrement reformulé, ou patientez quelques minutes — cela peut être une saturation temporaire des fournisseurs.',
      category: 'quota',
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
