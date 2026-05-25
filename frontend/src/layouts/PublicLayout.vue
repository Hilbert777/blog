<template>
  <div class="public-layout">
    <AppHeader />
    <main>
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppFooter from '@/components/common/AppFooter.vue'
import AppHeader from '@/components/common/AppHeader.vue'
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
}
</style>
