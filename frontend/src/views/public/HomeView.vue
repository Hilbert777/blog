<template>
  <section class="home-hero">
    <div class="container hero-inner">
      <div>
        <h1>Hilbert's Blog</h1>
        <p class="hero-subtitle">Wir müssen wissen,wir werden wissen.</p>
        <p class="hero-text">Here is a record of programming and life of a sophomore majoring in software engineering at Tianjin University.</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="goArticles">
            <BookOpen :size="18" />
            浏览文章
          </el-button>
          <el-button size="large" @click="$router.push('/login')">
            <Settings :size="18" />
            后台管理
          </el-button>
        </div>
      </div>
      <div class="hero-panel">
        <div class="hero-stat">
          <span>{{ pageData.total }}</span>
          <small>已发布文章</small>
        </div>
        <div class="hero-stat">
          <span>{{ categories.length }}</span>
          <small>内容分类</small>
        </div>
      </div>
    </div>
  </section>

  <section class="page-section">
    <div class="container home-grid">
      <div class="main-column">
        <div class="page-toolbar">
          <h2 class="section-title">最新文章</h2>
          <el-button text type="primary" @click="$router.push('/articles')">查看全部</el-button>
        </div>
        <PageLoading v-if="loading" />
        <div v-else-if="pageData.list.length" class="article-list">
          <ArticleCard v-for="article in pageData.list" :key="article.id" :article="article" />
        </div>
        <EmptyState v-else title="暂无文章" description="发布文章后会展示在这里" />
      </div>
      <aside class="side-column">
        <section class="author-card">
          <img class="author-avatar" src="/images/avatar.jpg" alt="Hilbert" />
          <div>
            <p class="author-label">Author</p>
            <h2>Hilbert</h2>
          </div>
          <p class="author-intro">Here is a record of programming and life of a sophomore majoring in software engineering at Tianjin University.</p>
          <div class="author-links">
            <a href="mailto:thysdzz@163.com">
              <Mail :size="16" />
              thysdzz@163.com
            </a>
            <a href="https://github.com/Hilbert777" target="_blank" rel="noreferrer">
              <Github :size="16" />
              GitHub
            </a>
          </div>
        </section>
        <h2 class="section-title">分类</h2>
        <CategoryNav :categories="categories" @change="goCategory" />
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, Github, Mail, Settings } from 'lucide-vue-next'

import { getArticlesApi } from '@/api/article'
import ArticleCard from '@/components/article/ArticleCard.vue'
import CategoryNav from '@/components/article/CategoryNav.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageLoading from '@/components/common/PageLoading.vue'
import { useCategoryStore } from '@/stores/category'
import type { Article, PageData } from '@/types/blog'

const router = useRouter()
const categoryStore = useCategoryStore()
const loading = ref(false)
const pageData = ref<PageData<Article>>({
  list: [],
  total: 0,
  pageNum: 1,
  pageSize: 6,
})

const categories = computed(() => categoryStore.categories)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      categoryStore.fetchCategories(),
      getArticlesApi({ pageNum: 1, pageSize: 6, status: 'published' }).then((data) => {
        pageData.value = data
      }),
    ])
  } finally {
    loading.value = false
  }
})

function goCategory(categoryId: number | '') {
  router.push({ path: '/articles', query: categoryId ? { categoryId } : {} })
}

function goArticles() {
  router.push({ name: 'articles', query: {} })
}
</script>

<style scoped>
.home-hero {
  padding: 68px 0 34px;
}

.hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 44px;
  align-items: center;
}

.eyebrow {
  margin: 0 0 12px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(42px, 7vw, 72px);
  line-height: 1;
}

.hero-text {
  max-width: 640px;
  margin: 10px 0 28px;
  color: #475569;
  font-size: 18px;
  line-height: 1.8;
}

.hero-subtitle {
  margin: 16px 0 0;
  color: #1d4ed8;
  font-size: clamp(18px, 3vw, 26px);
  font-weight: 700;
  line-height: 1.4;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-actions :deep(.el-button span) {
  gap: 8px;
}

.hero-panel {
  display: grid;
  gap: 14px;
}

.hero-stat {
  display: grid;
  gap: 6px;
  padding: 24px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
}

.hero-stat span {
  color: #1d4ed8;
  font-size: 38px;
  font-weight: 900;
}

.hero-stat small {
  color: #475569;
  font-size: 14px;
}

.home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 28px;
  align-items: start;
}

.article-list {
  display: grid;
  gap: 16px;
}

.side-column {
  position: sticky;
  top: 92px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.author-card {
  display: grid;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.author-avatar {
  width: 72px;
  height: 72px;
  border: 3px solid #dbeafe;
  border-radius: 8px;
  object-fit: cover;
}

.author-label {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.author-card h2 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
}

.author-intro {
  margin: 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.7;
}

.author-links {
  display: grid;
  gap: 8px;
}

.author-links a {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  word-break: break-all;
}

@media (max-width: 900px) {
  .hero-inner,
  .home-grid {
    grid-template-columns: 1fr;
  }

  .side-column {
    position: static;
  }
}
</style>
