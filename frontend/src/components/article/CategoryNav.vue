<template>
  <div class="category-nav">
    <el-button :type="!currentId ? 'primary' : 'default'" @click="$emit('change', '')">全部</el-button>
    <el-button
      v-for="category in categories"
      :key="category.id"
      :type="Number(currentId) === category.id ? 'primary' : 'default'"
      @click="$emit('change', category.id)"
    >
      {{ category.name }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '@/types/blog'

defineProps<{
  categories: Category[]
  currentId?: number | string
}>()

defineEmits<{
  change: [value: number | '']
}>()
</script>

<style scoped>
.category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-nav :deep(.el-button) {
  margin-left: 0;
}
</style>
