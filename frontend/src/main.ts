import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'md-editor-v3/lib/style.css'

import App from './App.vue'
import router from './router'
import './styles/global.css'

// 在 Vue 挂载前恢复主题，避免页面首次渲染时出现明暗主题闪烁。
const savedTheme = localStorage.getItem('blog_theme_mode') === 'dark' ? 'dark' : 'light'
document.documentElement.dataset.theme = savedTheme

const pinia = createPinia()

// 前端实践项目使用 Vue Router 管理页面、Pinia 管理状态、Element Plus 提供 UI 组件。
createApp(App).use(pinia).use(router).use(ElementPlus).mount('#app')
