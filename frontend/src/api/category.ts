import { mockCreateCategory, mockDeleteCategory, mockGetCategories, mockUpdateCategory } from '@/mock/blogDb'

// 分类 API 适配层：保留接口封装，方便以后把 Mock 实现替换成真实 HTTP 请求。
export function getCategoriesApi() {
  return mockGetCategories()
}

export function createCategoryApi(payload: { name: string }) {
  return mockCreateCategory(payload)
}

export function updateCategoryApi(id: number, payload: { name: string }) {
  return mockUpdateCategory(id, payload)
}

export function deleteCategoryApi(id: number) {
  return mockDeleteCategory(id)
}
