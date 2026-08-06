import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const openai = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

// Configuration des modèles
export const AI_CONFIG = {
  defaultModel: 'claude-3-sonnet-20240229',
  fallbackModel: 'llama-3.3-70b-versatile',
  geminiModel: 'gemini-3.5-flash',
  // Relevé à 16000 le 5 août : 4000 était probablement une cause réelle des
  // fichiers manquants en génération multi-fichiers — l'IA se faisait
  // couper avant d'avoir fini d'écrire tous les fichiers demandés. Gemini
  // 3.5 Flash-Lite et Claude supportent tous les deux largement plus
  // (jusqu'à 65 536 pour Gemini), donc aucune raison de rester à 4000.
  maxTokens: 16000,
  temperature: 0.2,
} as const
