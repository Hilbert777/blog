<template>
  <form class="search-bar" @submit.prevent="$emit('search')">
    <el-input
      :model-value="modelValue"
      clearable
      placeholder="输入标题或摘要关键词"
      @clear="$emit('clear')"
      @update:model-value="$emit('update:modelValue', String($event))"
    >
      <template #prefix>
        <Search :size="17" />
      </template>
    </el-input>
    <el-button type="primary" native-type="submit" :loading="loading">
      <Search :size="16" />
      搜索
    </el-button>
  </form>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'

// 通用搜索栏组件：通过 v-model 暴露关键词，通过事件通知父组件执行搜索或清空。
defineProps<{
  modelValue: string
  loading?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
  search: []
  clear: []
}>()
</script>

<style scoped>
.search-bar {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto;
  gap: 10px;
  width: min(620px, 100%);
}

.search-bar :deep(.el-button span) {
  gap: 6px;
}

@media (max-width: 520px) {
  .search-bar {
    grid-template-columns: 1fr;
  }
}
</style>
