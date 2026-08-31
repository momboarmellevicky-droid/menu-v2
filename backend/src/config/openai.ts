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

export const mistral = process.env.MISTRAL_API_KEY
  ? new OpenAI({
      apiKey: process.env.MISTRAL_API_KEY,
      baseURL: 'https://api.mistral.ai/v1',
    })
  : null

// Configuration des modèles
export const AI_CONFIG = {
  defaultModel: 'claude-sonnet-5',
  fallbackModel: 'llama-3.3-70b-versatile',
  geminiModel: 'gemini-3.5-flash',
  mistralModel: 'mistral-large-latest',
  maxTokens: 16000,
  temperature: 0.2,
} as const
