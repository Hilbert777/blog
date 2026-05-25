<template>
  <el-container class="admin-layout">
    <el-aside width="228px" class="admin-aside">
      <RouterLink class="admin-brand" to="/admin/dashboard">
        <span class="admin-brand-mark">B</span>
        <span>Blog Admin</span>
      </RouterLink>
      <el-menu router :default-active="$route.path" background-color="#0f172a" text-color="#cbd5e1" active-text-color="#ffffff">
        <el-menu-item index="/admin/dashboard">
          <LayoutDashboard :size="18" />
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/admin/articles">
          <FileText :size="18" />
          <span>文章管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/categories">
          <Tags :size="18" />
          <span>分类管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <div>
          <strong>{{ authStore.userInfo?.nickname || '管理员' }}</strong>
          <span class="muted"> / {{ authStore.userInfo?.role || 'admin' }}</span>
        </div>
        <el-button @click="logout">
          <LogOut :size="16" />
          退出
        </el-button>
      </el-header>
      <el-main class="admin-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { FileText, LayoutDashboard, LogOut, Tags } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f6f7fb;
}

.admin-aside {
  min-height: 100vh;
  background: #0f172a;
}

.admin-brand {
  display: flex;
  gap: 10px;
  align-items: center;
  height: 64px;
  padding: 0 20px;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
}

.admin-brand-mark {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 8px;
  background: #2563eb;
}

.admin-aside :deep(.el-menu) {
  border-right: 0;
}

.admin-aside :deep(.el-menu-item) {
  display: flex;
  gap: 10px;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.admin-header :deep(.el-button span) {
  gap: 6px;
}

.admin-main {
  padding: 0;
}

@media (max-width: 780px) {
  .admin-layout {
    display: block;
  }

  .admin-aside {
    width: 100% !important;
    min-height: auto;
  }

  .admin-brand {
    height: 56px;
  }

  .admin-aside :deep(.el-menu) {
    display: flex;
    overflow-x: auto;
  }
}
</style>
