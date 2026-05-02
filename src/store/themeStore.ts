import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminTheme } from '../utils/adminTheme'

interface ThemeStore {
  theme: AdminTheme
  toggle: () => void
}

export const useAdminThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'admin-theme' },
  ),
)
