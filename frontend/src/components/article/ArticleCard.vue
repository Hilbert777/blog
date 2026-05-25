<template>
  <RouterLink class="article-card" :to="{ name: 'article-detail', params: { id: article.id } }">
    <div v-if="article.cover" class="cover" :style="{ backgroundImage: `url(${article.cover})` }"></div>
    <div class="card-body">
      <div class="meta">
        <span>{{ article.categoryName }}</span>
        <span>{{ formatDate(article.createdAt) }}</span>
      </div>
      <h3>{{ article.title }}</h3>
      <p>{{ article.summary }}</p>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import type { Article } from '@/types/blog'
import { formatDate } from '@/utils/format'

defineProps<{
  article: Article
}>()
</script>

<style scoped>
.article-card {
  display: flex;
  min-height: 172px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  cursor: pointer;
}

.article-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  transform: translateY(-3px);
}

.cover {
  width: 220px;
  flex: 0 0 220px;
  background-position: center;
  background-size: cover;
}

.card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

h3 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  line-height: 1.35;
}

p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #475569;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

@media (max-width: 700px) {
  .article-card {
    flex-direction: column;
  }

  .cover {
    width: 100%;
    height: 180px;
    flex-basis: auto;
  }
}
</style>
