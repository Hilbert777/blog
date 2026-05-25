import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

const THEME_KEY = 'blog_theme_mode'

// 从 localStorage 读取用户上次选择的主题；未设置时默认白天模式。
function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY)
  return saved === 'dark' ? 'dark' : 'light'
}

// 通过 data-theme 驱动 CSS 变量切换，同时把选择写回本地存储。
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
