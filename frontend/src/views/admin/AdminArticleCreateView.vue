<template>
  <section class="admin-page">
    <div class="page-toolbar">
      <h1 class="admin-title">新增文章</h1>
    </div>
    <div class="admin-panel">
      <ArticleForm :submit-loading="loading" @submit="submit" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import { createArticleApi } from '@/api/article'
import ArticleForm from '@/components/article/ArticleForm.vue'
import type { ArticlePayload } from '@/types/blog'

const router = useRouter()
const loading = ref(false)

async function submit(payload: ArticlePayload) {
  loading.value = true
  try {
    await createArticleApi(payload)
    ElMessage.success('保存成功')
    router.push('/admin/articles')
  } finally {
    loading.value = false
  }
}
</script>
