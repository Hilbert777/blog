import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/PublicLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/public/HomeView.vue') },
        { path: 'articles', name: 'articles', component: () => import('@/views/public/ArticleListView.vue') },
        { path: 'articles/:id', name: 'article-detail', component: () => import('@/views/public/ArticleDetailView.vue') },
      ],
    },
    { path: '/login', name: 'login', component: () => import('@/views/admin/LoginView.vue') },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'articles', name: 'admin-articles', component: () => import('@/views/admin/AdminArticleListView.vue') },
        { path: 'articles/create', name: 'admin-article-create', component: () => import('@/views/admin/AdminArticleCreateView.vue') },
        { path: 'articles/:id/edit', name: 'admin-article-edit', component: () => import('@/views/admin/AdminArticleEditView.vue') },
        { path: 'categories', name: 'admin-categories', component: () => import('@/views/admin/AdminCategoryView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAuth && authStore.isLoggedIn && !authStore.userInfo) {
    try {
      await authStore.loadMe()
    } catch {
      authStore.logout()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    return '/admin/dashboard'
  }

  return true
})

export default router
