<template>
  <section class="page-section">
    <div class="container detail-wrap">
      <PageLoading v-if="loading" />
      <template v-else-if="article">
        <article class="detail-article">
          <div class="detail-meta">
            <span>{{ article.categoryName }}</span>
            <span>{{ formatDate(article.createdAt) }}</span>
          </div>
          <h1>{{ article.title }}</h1>
          <p class="summary">{{ article.summary }}</p>
          <img v-if="article.cover" class="detail-cover" :src="article.cover" :alt="article.title" />
          <MdPreview class="md-preview" :model-value="article.content || ''" preview-theme="github" />
        </article>
        <div class="detail-actions">
          <el-button @click="$router.push('/articles')">
            <ArrowLeft :size="16" />
            返回列表
          </el-button>
        </div>
      </template>
      <EmptyState
        v-else
        title="文章不存在"
        description="该文章可能已删除或未发布"
        action-text="返回文章列表"
        @action="$router.push('/articles')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { MdPreview } from 'md-editor-v3'
import { ArrowLeft } from 'lucide-vue-next'

import { getArticleApi } from '@/api/article'
import EmptyState from '@/components/common/EmptyState.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import type { Article } from '@/types/blog'
import { formatDate } from '@/utils/format'

const route = useRoute()
const loading = ref(false)
const article = ref<Article | null>(null)

// 详情页通过路由参数 id 读取文章；如果文章不存在或未发布，则显示空状态。
onMounted(async () => {
  loading.value = true
  try {
    article.value = await getArticleApi(String(route.params.id))
  } catch {
    article.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-wrap {
  max-width: 900px;
}

.detail-article {
  padding: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

h1 {
  margin: 12px 0;
  color: #0f172a;
  font-size: clamp(30px, 5vw, 44px);
  line-height: 1.2;
}

.summary {
  margin: 0 0 24px;
  color: #475569;
  font-size: 17px;
  line-height: 1.8;
}

.detail-cover {
  width: 100%;
  max-height: 420px;
  margin-bottom: 24px;
  object-fit: cover;
  border-radius: 8px;
}

.detail-actions {
  margin-top: 18px;
}

.detail-actions :deep(.el-button span) {
  gap: 6px;
}

@media (max-width: 640px) {
  .detail-article {
    padding: 20px;
  }
}
</style>
