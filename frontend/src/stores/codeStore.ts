import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GeneratedCode, ExportFormat } from '../types'

interface CodeState {
  history: GeneratedCode[]
  currentCode: GeneratedCode | null
  isGenerating: boolean
  exportFormat: ExportFormat
  addToHistory: (code: GeneratedCode) => void
  setCurrentCode: (code: GeneratedCode | null) => void
  setGenerating: (generating: boolean) => void
  setExportFormat: (format: ExportFormat) => void
  clearHistory: () => void
  removeFromHistory: (id: string) => void
}

export const useCodeStore = create<CodeState>()(
  persist(
    (set) => ({
      history: [],
      currentCode: null,
      isGenerating: false,
      exportFormat: 'react',
      addToHistory: (code) =>
        set((state) => ({
          history: [code, ...state.history].slice(0, 100),
        })),
      setCurrentCode: (code) => set({ currentCode: code }),
      setGenerating: (generating) => set({ isGenerating: generating }),
      setExportFormat: (format) => set({ exportFormat: format }),
      clearHistory: () => set({ history: [] }),
      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'menu-code-v2',
      partialize: (state) => ({ history: state.history, exportFormat: state.exportFormat }),
    }
  )
)