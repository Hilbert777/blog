export type ArticleStatus = 'draft' | 'published'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageData<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  role: string
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
}

export interface Category {
  id: number
  name: string
  createdAt?: string
}

export interface Article {
  id: number
  title: string
  summary: string
  content?: string
  categoryId: number
  categoryName: string
  cover?: string
  status: ArticleStatus
  createdAt: string
  updatedAt?: string
}

export interface ArticleQuery {
  pageNum?: number
  pageSize?: number
  keyword?: string
  categoryId?: number | ''
  status?: ArticleStatus | ''
}

export interface ArticlePayload {
  title: string
  summary: string
  content: string
  categoryId: number | ''
  cover?: string
  status: ArticleStatus
}

export interface DashboardStats {
  articleTotal: number
  publishedTotal: number
  draftTotal: number
  categoryTotal: number
}
