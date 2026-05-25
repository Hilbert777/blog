import {
  mockCreateArticle,
  mockDashboardStats,
  mockDeleteArticle,
  mockGetAdminArticles,
  mockGetArticle,
  mockGetArticles,
  mockUpdateArticle,
} from '@/mock/blogDb'
import type { ArticlePayload, ArticleQuery } from '@/types/blog'

// 文章 API 适配层：页面仍按真实项目调用 API，当前实现转发到 localStorage Mock 数据层。
export function getArticlesApi(params: ArticleQuery) {
  return mockGetArticles(params)
}

export function getArticleApi(id: number | string) {
  return mockGetArticle(id)
}

export function getAdminArticlesApi(params: ArticleQuery) {
  return mockGetAdminArticles(params)
}

export function getAdminArticleApi(id: number | string) {
  return mockGetArticle(id, true)
}

export function createArticleApi(payload: ArticlePayload) {
  return mockCreateArticle(payload)
}

export function updateArticleApi(id: number | string, payload: ArticlePayload) {
  return mockUpdateArticle(id, payload)
}

export function deleteArticleApi(id: number | string) {
  return mockDeleteArticle(id)
}

export function getDashboardStatsApi() {
  return mockDashboardStats()
}
