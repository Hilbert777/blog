<template>
  <div class="empty-state">
    <Inbox :size="38" />
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
    <el-button v-if="actionText" type="primary" @click="$emit('action')">{{ actionText }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

defineProps<{
  title: string
  description?: string
  actionText?: string
}>()

defineEmits<{
  action: []
}>()
</script>

<style scoped>
.empty-state {
  display: grid;
  place-items: center;
  min-height: 260px;
  padding: 32px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  background: #fff;
  text-align: center;
}

.empty-state h3 {
  margin: 12px 0 6px;
  color: #1f2937;
  font-size: 18px;
}

.empty-state p {
  margin: 0 0 16px;
}
</style>
