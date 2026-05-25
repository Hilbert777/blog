<template>
  <section class="admin-page">
    <div class="page-toolbar">
      <h1 class="admin-title">编辑文章</h1>
    </div>
    <div class="admin-panel">
      <PageLoading v-if="loadingArticle" />
      <ArticleForm v-else :initial-value="formValue" :submit-loading="saving" @submit="submit" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { getAdminArticleApi, updateArticleApi } from '@/api/article'
import ArticleForm from '@/components/article/ArticleForm.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { ArticlePayload } from '@/types/blog'

const route = useRoute()
const router = useRouter()
const loadingArticle = ref(false)
const saving = ref(false)
const formValue = ref<ArticlePayload>()

onMounted(async () => {
  loadingArticle.value = true
  try {
    const article = await getAdminArticleApi(String(route.params.id))
    formValue.value = {
      title: article.title,
      summary: article.summary,
      content: article.content || '',
      categoryId: article.categoryId,
      cover: article.cover || '',
      status: article.status,
    }
  } finally {
    loadingArticle.value = false
  }
})

async function submit(payload: ArticlePayload) {
  saving.value = true
  try {
    await updateArticleApi(String(route.params.id), payload)
    ElMessage.success('保存成功')
    router.push('/admin/articles')
  } finally {
    saving.value = false
  }
}
</script>
