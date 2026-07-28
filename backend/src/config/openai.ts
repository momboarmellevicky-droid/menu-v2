import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Configuration des modèles
export const AI_CONFIG = {
  defaultModel: 'claude-3-sonnet-20240229',
  fallbackModel: 'gpt-4-turbo-preview',
  maxTokens: 4000,
  temperature: 0.2,
} as const