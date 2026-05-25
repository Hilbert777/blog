import { mockCurrentUser, mockLogin } from '@/mock/blogDb'

export function loginApi(payload: { username: string; password: string }) {
  return mockLogin(payload)
}

export function getCurrentUserApi() {
  return mockCurrentUser()
}
