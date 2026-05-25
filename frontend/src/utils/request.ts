import axios, { type AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

import { getToken, removeToken } from './token'
import type { ApiResponse } from '@/types/blog'

// Axios 请求实例保留给后续真实后端联调；当前业务 API 默认走 localStorage Mock。
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

// 请求拦截器负责自动携带后台登录 token。
request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器统一处理真实后端的业务 code 和 401 登录过期场景。
request.interceptors.response.use(
  (response) => {
    const result = response.data as ApiResponse<unknown>
    if (typeof result?.code === 'number') {
      if (result.code === 0) {
        return result.data
      }

      if (result.code === 401) {
        removeToken()
        ElMessage.error(result.message || '登录已过期，请重新登录')
        if (!location.pathname.includes('/login')) {
          location.href = '/login'
        }
      } else {
        ElMessage.error(result.message || '请求失败')
      }

      return Promise.reject(new Error(result.message || 'request failed'))
    }

    return response.data
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '网络异常'
    if (status === 401) {
      removeToken()
      ElMessage.error('登录已过期，请重新登录')
      if (!location.pathname.includes('/login')) {
        location.href = '/login'
      }
    } else {
      ElMessage.error(message)
    }
    return Promise.reject(error)
  },
)

export default request
