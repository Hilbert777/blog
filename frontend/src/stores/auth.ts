import { defineStore } from 'pinia'

import { getCurrentUserApi, loginApi } from '@/api/auth'
import type { UserInfo } from '@/types/blog'
import { getToken, removeToken, setToken } from '@/utils/token'

// 后台登录状态仓库：token 持久化在 localStorage，刷新页面后仍可判断登录状态。
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken() || '',
    userInfo: null as UserInfo | null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
  },
  actions: {
    async login(payload: { username: string; password: string }) {
      const result = await loginApi(payload)
      this.token = result.token
      this.userInfo = result.userInfo
      setToken(result.token)
    },
    async loadMe() {
      if (!this.token) return null
      this.userInfo = await getCurrentUserApi()
      return this.userInfo
    },
    logout() {
      this.token = ''
      this.userInfo = null
      removeToken()
    },
  },
})
