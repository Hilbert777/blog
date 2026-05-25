import { defineStore } from 'pinia'

import { getArticlesApi } from '@/api/article'
import type { Article, ArticleQuery, PageData } from '@/types/blog'

// 文章列表状态仓库：缓存分页结果和 loading 状态，供前台列表页面复用。
export const useArticleStore = defineStore('article', {
  state: () => ({
    pageData: {
      list: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
    } as PageData<Article>,
    loading: false,
  }),
  actions: {
    async fetchArticles(params: ArticleQuery) {
      this.loading = true
      try {
        this.pageData = await getArticlesApi(params)
      } finally {
        this.loading = false
      }
    },
  },
})
