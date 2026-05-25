export type ArticleStatus = 'draft' | 'published'

// 统一接口响应结构；当前 Mock API 不直接返回该结构，但保留给后续真实后端接入。
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页数据结构，前台文章列表和后台文章管理共用。
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

// 文章查询条件，支持分页、关键词、分类和发布状态筛选。
export interface ArticleQuery {
  pageNum?: number
  pageSize?: number
  keyword?: string
  categoryId?: number | ''
  status?: ArticleStatus | ''
}

// 文章新增/编辑表单提交结构，Markdown 正文保存在 content 字段中。
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
