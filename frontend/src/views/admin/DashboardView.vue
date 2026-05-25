<template>
  <section class="admin-page">
    <div class="page-toolbar">
      <h1 class="admin-title">仪表盘</h1>
      <el-button type="primary" @click="$router.push('/admin/articles/create')">
        <Plus :size="16" />
        新建文章
      </el-button>
    </div>
    <div v-loading="loading" class="stats-grid">
      <div class="stat-card">
        <FileText :size="24" />
        <strong>{{ stats.articleTotal }}</strong>
        <span>文章总数</span>
      </div>
      <div class="stat-card">
        <CheckCircle2 :size="24" />
        <strong>{{ stats.publishedTotal }}</strong>
        <span>已发布</span>
      </div>
      <div class="stat-card">
        <PencilLine :size="24" />
        <strong>{{ stats.draftTotal }}</strong>
        <span>草稿</span>
      </div>
      <div class="stat-card">
        <Tags :size="24" />
        <strong>{{ stats.categoryTotal }}</strong>
        <span>分类</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CheckCircle2, FileText, PencilLine, Plus, Tags } from 'lucide-vue-next'

import { getDashboardStatsApi } from '@/api/article'
import type { DashboardStats } from '@/types/blog'

const loading = ref(false)
const stats = ref<DashboardStats>({
  articleTotal: 0,
  publishedTotal: 0,
  draftTotal: 0,
  categoryTotal: 0,
})

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await getDashboardStatsApi()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: grid;
  gap: 8px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #475569;
  background: #fff;
}

.stat-card svg {
  color: #2563eb;
}

.stat-card strong {
  color: #0f172a;
  font-size: 34px;
  line-height: 1.1;
}

.page-toolbar :deep(.el-button span) {
  gap: 6px;
}

@media (max-width: 920px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
