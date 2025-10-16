import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'blue' | 'purple'

export interface ThemeConfig {
  name: string
  displayName: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    shadow: string
  }
  surface: string
  text: string
  textSecondary: string
  border: string
  shadow: string
  gradients: {
    background: string
    card: string
    button: string
    text: string
  }
}

const themes: Record<Theme, ThemeConfig> = {
  light: {
    name: 'light',
    displayName: '浅色主题',
    colors: {
      primary: 'blue',
      secondary: 'purple',
      accent: 'pink',
      background: 'from-blue-50 via-indigo-50 to-purple-50',
      surface: 'bg-white/80',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      border: 'border-white/20',
      shadow: 'shadow-xl'
    },
    surface: 'bg-white/80',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-white/20',
    shadow: 'shadow-xl',
    gradients: {
      background: 'from-blue-50 via-indigo-50 to-purple-50',
      card: 'from-blue-50/50 to-purple-50/50',
      button: 'from-blue-500 to-purple-600',
      text: 'from-blue-600 via-purple-600 to-pink-600'
    }
  },
  dark: {
    name: 'dark',
    displayName: '深色主题',
    colors: {
      primary: 'gray',
      secondary: 'slate',
      accent: 'zinc',
      background: 'from-gray-900 via-slate-900 to-zinc-900',
      surface: 'bg-gray-800/80',
      text: 'text-gray-100',
      textSecondary: 'text-gray-300',
      border: 'border-gray-700/20',
      shadow: 'shadow-2xl'
    },
    surface: 'bg-gray-800/80',
    text: 'text-gray-100',
    textSecondary: 'text-gray-300',
    border: 'border-gray-700/20',
    shadow: 'shadow-2xl',
    gradients: {
      background: 'from-gray-900 via-slate-900 to-zinc-900',
      card: 'from-gray-800/50 to-slate-800/50',
      button: 'from-gray-600 to-slate-700',
      text: 'from-gray-100 via-slate-100 to-zinc-100'
    }
  },
  blue: {
    name: 'blue',
    displayName: '蓝色主题',
    colors: {
      primary: 'blue',
      secondary: 'cyan',
      accent: 'sky',
      background: 'from-blue-100 via-cyan-50 to-sky-100',
      surface: 'bg-blue-50/80',
      text: 'text-blue-900',
      textSecondary: 'text-blue-700',
      border: 'border-blue-200/20',
      shadow: 'shadow-xl'
    },
    surface: 'bg-blue-50/80',
    text: 'text-blue-900',
    textSecondary: 'text-blue-700',
    border: 'border-blue-200/20',
    shadow: 'shadow-xl',
    gradients: {
      background: 'from-blue-100 via-cyan-50 to-sky-100',
      card: 'from-blue-50/50 to-cyan-50/50',
      button: 'from-blue-500 to-cyan-600',
      text: 'from-blue-600 via-cyan-600 to-sky-600'
    }
  },
  purple: {
    name: 'purple',
    displayName: '紫色主题',
    colors: {
      primary: 'purple',
      secondary: 'violet',
      accent: 'fuchsia',
      background: 'from-purple-100 via-violet-50 to-fuchsia-100',
      surface: 'bg-purple-50/80',
      text: 'text-purple-900',
      textSecondary: 'text-purple-700',
      border: 'border-purple-200/20',
      shadow: 'shadow-xl'
    },
    surface: 'bg-purple-50/80',
    text: 'text-purple-900',
    textSecondary: 'text-purple-700',
    border: 'border-purple-200/20',
    shadow: 'shadow-xl',
    gradients: {
      background: 'from-purple-100 via-violet-50 to-fuchsia-100',
      card: 'from-purple-50/50 to-violet-50/50',
      button: 'from-purple-500 to-violet-600',
      text: 'from-purple-600 via-violet-600 to-fuchsia-600'
    }
  }
}

interface ThemeStore {
  currentTheme: Theme
  setTheme: (theme: Theme) => void
  getThemeConfig: () => ThemeConfig
  getAvailableThemes: () => ThemeConfig[]
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: 'light',
      setTheme: (theme: Theme) => set({ currentTheme: theme }),
      getThemeConfig: () => themes[get().currentTheme],
      getAvailableThemes: () => Object.values(themes)
    }),
    {
      name: 'theme-storage',
    }
  )
)
