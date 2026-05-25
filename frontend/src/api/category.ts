import { mockCreateCategory, mockDeleteCategory, mockGetCategories, mockUpdateCategory } from '@/mock/blogDb'

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
