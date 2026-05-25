import axios, { type AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

import { getToken, removeToken } from './token'
import type { ApiResponse } from '@/types/blog'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
