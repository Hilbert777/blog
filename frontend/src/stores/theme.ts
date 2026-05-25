import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

const THEME_KEY = 'blog_theme_mode'

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY)
  return saved === 'dark' ? 'dark' : 'light'
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode
  localStorage.setItem(THEME_KEY, mode)
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: getInitialTheme(),
  }),
  getters: {
    isDark: (state) => state.mode === 'dark',
  },
  actions: {
    init() {
      applyTheme(this.mode)
    },
    toggle() {
      this.mode = this.mode === 'dark' ? 'light' : 'dark'
      applyTheme(this.mode)
    },
  },
})
