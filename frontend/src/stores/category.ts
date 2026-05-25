import { defineStore } from 'pinia'

import { getCategoriesApi } from '@/api/category'
import type { Category } from '@/types/blog'

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
