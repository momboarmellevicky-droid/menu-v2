import { create } from 'zustand'

interface UIState {
  theme: 'dark' | 'light'
  sidebarOpen: boolean
  activeModal: string | null
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  setTheme: (theme: 'dark' | 'light') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (modal: string) => void
  closeModal: () => void
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  hideToast: () => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  sidebarOpen: false,
  activeModal: null,
  toast: null,
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  showToast: (message, type) => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}))