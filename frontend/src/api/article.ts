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
