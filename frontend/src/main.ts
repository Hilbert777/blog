import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'md-editor-v3/lib/style.css'

import App from './App.vue'
import router from './router'
import './styles/global.css'

const savedTheme = localStorage.getItem('blog_theme_mode') === 'dark' ? 'dark' : 'light'
document.documentElement.dataset.theme = savedTheme

const pinia = createPinia()

createApp(App).use(pinia).use(router).use(ElementPlus).mount('#app')
