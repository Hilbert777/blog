import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  // Vite 使用官方 Vue 插件编译 .vue 单文件组件。
  plugins: [vue()],
  resolve: {
    alias: {
      // 将 @ 指向 src，避免在组件中编写过长的相对路径。
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // 当前版本默认使用 localStorage Mock API；该代理保留给后续真实后端联调。
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
