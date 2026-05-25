<template>
  <header class="app-header">
    <div class="container header-inner">
      <RouterLink class="brand" to="/">
        <img class="brand-mark" src="/images/favicon.jpg" alt="Hilbert Blog" />
        <span>Hilbert Blog</span>
      </RouterLink>

      <nav class="nav-links">
        <RouterLink to="/">首页</RouterLink>
        <button type="button" class="nav-button" @click="goArticles">文章</button>
        <RouterLink to="/login">后台</RouterLink>
      </nav>

      <form class="header-search" @submit.prevent="submitSearch">
        <el-input v-model="keyword" clearable placeholder="搜索文章" @clear="submitSearch">
          <template #prefix>
            <Search :size="16" />
          </template>
        </el-input>
        <el-button type="primary" native-type="submit" aria-label="搜索文章">
          <Search :size="16" />
        </el-button>
        <el-button circle :title="themeStore.isDark ? '切换到白天模式' : '切换到黑夜模式'" @click="themeStore.toggle()">
          <Sun v-if="themeStore.isDark" :size="17" />
          <Moon v-else :size="17" />
        </el-button>
      </form>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Moon, Search, Sun } from 'lucide-vue-next'

import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()
const keyword = ref('')

// 顶部搜索框提交后统一跳转到文章列表页，由列表页根据 keyword 做筛选。
function submitSearch() {
  router.push({
    path: '/articles',
    query: keyword.value.trim() ? { keyword: keyword.value.trim() } : {},
  })
}

// 导航栏“文章”入口使用命名路由，避免路径字符串在多个地方重复维护。
function goArticles() {
  router.push({ name: 'articles', query: {} })
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(226, 232, 240, 0.88);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
}

.header-inner {
  display: grid;
  grid-template-columns: auto 1fr minmax(300px, 420px);
  gap: 24px;
  align-items: center;
  min-height: 68px;
}

.brand {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  object-fit: cover;
}

.nav-links {
  display: flex;
  gap: 22px;
  align-items: center;
  color: #475569;
  font-weight: 600;
}

.nav-button {
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.nav-links a.router-link-active {
  color: #2563eb;
}

.header-search {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) 42px 42px;
  gap: 8px;
  align-items: center;
}

.header-search :deep(.el-input__wrapper) {
  border-radius: 999px;
}

@media (max-width: 760px) {
  .header-inner {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px 0;
  }

  .nav-links {
    justify-content: space-between;
  }

  .header-search {
    grid-template-columns: minmax(0, 1fr) 42px 42px;
  }
}
</style>
