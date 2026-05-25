import { mockCurrentUser, mockLogin } from '@/mock/blogDb'

// 登录 API 适配层：当前通过本地 Mock 校验账号密码，并模拟返回后台 token。
export function loginApi(payload: { username: string; password: string }) {
  return mockLogin(payload)
}

export function getCurrentUserApi() {
  return mockCurrentUser()
}
