<template>
  <div class="page-loading">
    <el-icon class="is-loading" :size="28">
      <Loading />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
</script>

<style scoped>
.page-loading {
  display: grid;
  min-height: 260px;
  place-items: center;
  color: #2563eb;
}
</style>
