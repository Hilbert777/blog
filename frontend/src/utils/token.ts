const TOKEN_KEY = 'blog_admin_token'

// token 工具集中封装 localStorage 读写，避免各组件直接操作存储 key。
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}
