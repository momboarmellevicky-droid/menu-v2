import { z } from 'zod'

export const generateCodeSchema = z.object({
  prompt: z.string().min(1, 'Le prompt est requis').max(5000, 'Prompt trop long'),
  framework: z.enum(['react', 'html', 'vue', 'react-native']).default('react'),
  architecture: z.enum(['frontend', 'fullstack', 'mobile']).default('frontend'),
  projectId: z.string().uuid().optional(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  description: z.string().max(1000).optional(),
  architecture: z.enum(['frontend', 'fullstack', 'mobile']).default('frontend'),
})

export const deploySchema = z.object({
  projectId: z.string().uuid(),
  platform: z.enum(['web', 'pwa', 'android', 'ios']),
})

export const inviteTeamSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']).default('editor'),
})

export type GenerateCodeInput = z.infer<typeof generateCodeSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type DeployInput = z.infer<typeof deploySchema>
export type InviteTeamInput = z.infer<typeof inviteTeamSchema>