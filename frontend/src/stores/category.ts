import { defineStore } from 'pinia'

import { getCategoriesApi } from '@/api/category'
import type { Category } from '@/types/blog'

// 分类状态仓库：前台筛选、首页分类栏和后台分类管理共用同一份分类列表。
export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [] as Category[],
    loading: false,
  }),
  actions: {
    async fetchCategories() {
      this.loading = true
      try {
        this.categories = await getCategoriesApi()
      } finally {
        this.loading = false
      }
    },
  },
})
