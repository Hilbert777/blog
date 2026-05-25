<template>
  <section class="admin-page">
    <div class="page-toolbar">
      <h1 class="admin-title">文章管理</h1>
      <el-button type="primary" @click="$router.push('/admin/articles/create')">
        <Plus :size="16" />
        新增文章
      </el-button>
    </div>

    <div class="admin-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" clearable placeholder="搜索标题" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.categoryId" clearable placeholder="全部分类" style="width: 160px">
            <el-option v-for="item in categoryStore.categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="pageData.list" row-key="id">
        <el-table-column prop="title" label="标题" min-width="220" />
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status">{{ row.status === 'published' ? '已发布' : '草稿' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="$router.push(`/admin/articles/${row.id}/edit`)">
              <Pencil :size="15" />
              编辑
            </el-button>
            <el-button text type="danger" @click="remove(row.id)">
              <Trash2 :size="15" />
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :current-page="query.pageNum"
          :page-size="query.pageSize"
          :total="pageData.total"
          @current-change="changePage"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'

import { deleteArticleApi, getAdminArticlesApi } from '@/api/article'
import { useCategoryStore } from '@/stores/category'
import type { Article, ArticleQuery, PageData } from '@/types/blog'
import { formatDate } from '@/utils/format'

const categoryStore = useCategoryStore()
const loading = ref(false)
const query = reactive<ArticleQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  categoryId: '',
  status: '',
})
const pageData = ref<PageData<Article>>({
  list: [],
  total: 0,
  pageNum: 1,
  pageSize: 10,
})

onMounted(async () => {
  await categoryStore.fetchCategories()
  fetchList()
})

async function fetchList() {
  loading.value = true
  try {
    pageData.value = await getAdminArticlesApi(query)
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  fetchList()
}

function reset() {
  query.pageNum = 1
  query.keyword = ''
  query.categoryId = ''
  query.status = ''
  fetchList()
}

function changePage(value: number) {
  query.pageNum = value
  fetchList()
}

async function remove(id: number) {
  await ElMessageBox.confirm('确定删除这篇文章吗？', '删除确认', { type: 'warning' })
  await deleteArticleApi(id)
  ElMessage.success('删除成功')
  fetchList()
}
</script>

<style scoped>
.query-form {
  margin-bottom: 10px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.page-toolbar :deep(.el-button span),
.admin-panel :deep(.el-button span) {
  gap: 6px;
}
</style>
