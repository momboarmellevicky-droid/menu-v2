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
  geminiModel: 'gemini-1.5-flash',
  maxTokens: 4000,
  temperature: 0.2,
} as const
