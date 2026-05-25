<template>
  <section class="page-section">
    <div class="container">
      <div class="list-header">
        <div>
          <h1>文章列表</h1>
          <p class="muted">{{ currentSummary }}</p>
        </div>
        <SearchBar v-model="keyword" :loading="loading" @search="submitSearch" @clear="clearSearch" />
      </div>

      <div class="filter-panel">
        <CategoryNav :categories="categoryStore.categories" :current-id="categoryId" @change="changeCategory" />
      </div>

      <PageLoading v-if="loading" />
      <div v-else-if="pageData.list.length" class="article-list">
        <ArticleCard v-for="article in pageData.list" :key="article.id" :article="article" />
      </div>
      <EmptyState
        v-else
        title="未找到相关文章"
        description="可以清空搜索条件或切换分类"
        action-text="查看全部"
        @action="resetFilters"
      />

      <div v-if="pageData.total > pageData.pageSize" class="pagination-wrap">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page="pageNum"
          :page-size="pageData.pageSize"
          :total="pageData.total"
          @current-change="changePage"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getArticlesApi } from '@/api/article'
import ArticleCard from '@/components/article/ArticleCard.vue'
import CategoryNav from '@/components/article/CategoryNav.vue'
import SearchBar from '@/components/article/SearchBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import { useCategoryStore } from '@/stores/category'
import type { Article, PageData } from '@/types/blog'
import { normalizeKeyword } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()

const loading = ref(false)
const keyword = ref('')
const categoryId = ref<number | ''>('')
const pageNum = ref(1)
const pageData = ref<PageData<Article>>({
  list: [],
  total: 0,
  pageNum: 1,
  pageSize: 8,
})

const currentSummary = computed(() => {
  const parts = []
  if (keyword.value) parts.push(`关键词：${keyword.value}`)
  const category = categoryStore.categories.find((item) => item.id === Number(categoryId.value))
  if (category) parts.push(`分类：${category.name}`)
  return parts.length ? parts.join('，') : '全部已发布文章'
})

// 文章列表以 URL query 作为筛选状态来源，刷新页面后仍能保留搜索和分类条件。
watch(
  () => route.fullPath,
  async () => {
    if (!categoryStore.categories.length) {
      await categoryStore.fetchCategories()
    }
    syncQuery()
    fetchList()
  },
  { immediate: true },
)

// 将路由 query 同步到页面响应式状态。
function syncQuery() {
  keyword.value = normalizeKeyword(route.query.keyword)
  categoryId.value = route.query.categoryId ? Number(route.query.categoryId) : ''
  pageNum.value = route.query.pageNum ? Number(route.query.pageNum) : 1
}

// 根据当前页码、关键词和分类查询文章；实际数据由 localStorage Mock API 返回。
async function fetchList() {
  loading.value = true
  try {
    pageData.value = await getArticlesApi({
      pageNum: pageNum.value,
      pageSize: 8,
      keyword: keyword.value,
      categoryId: categoryId.value,
      status: 'published',
    })
  } finally {
    loading.value = false
  }
}

// 统一更新文章列表 query，避免搜索、分类和分页互相覆盖。
function pushQuery(next: Record<string, string | number | undefined>) {
  router.push({
    path: '/articles',
    query: {
      keyword: keyword.value || undefined,
      categoryId: categoryId.value || undefined,
      pageNum: pageNum.value > 1 ? pageNum.value : undefined,
      ...next,
    },
  })
}

// 搜索时重置到第一页，防止原页码在新筛选条件下越界。
function submitSearch() {
  pageNum.value = 1
  pushQuery({ keyword: keyword.value || undefined, pageNum: undefined })
}

// 清空关键词后保留其它筛选条件，并重新查询。
function clearSearch() {
  keyword.value = ''
  pageNum.value = 1
  pushQuery({ keyword: undefined, pageNum: undefined })
}

// 切换分类时重置分页，并把分类 id 写入 URL。
function changeCategory(value: number | '') {
  categoryId.value = value
  pageNum.value = 1
  pushQuery({ categoryId: value || undefined, pageNum: undefined })
}

// 分页组件变化后写入 pageNum，再触发路由监听重新加载列表。
function changePage(value: number) {
  pageNum.value = value
  pushQuery({ pageNum: value })
}

// 空状态按钮使用：清除全部筛选条件并回到文章列表首页。
function resetFilters() {
  keyword.value = ''
  categoryId.value = ''
  pageNum.value = 1
  router.push('/articles')
}
</script>

<style scoped>
.list-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 520px);
  gap: 24px;
  align-items: end;
  margin-bottom: 18px;
}

h1 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 32px;
}

.filter-panel {
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.article-list {
  display: grid;
  gap: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

@media (max-width: 820px) {
  .list-header {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
}
</style>
