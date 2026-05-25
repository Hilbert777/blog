<template>
  <footer class="app-footer">
    <div class="container footer-inner">
      <span>© 2026 Hilbert's Blog 版权所有</span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 72px;
  color: #64748b;
  font-size: 14px;
  text-align: center;
}

@media (max-width: 640px) {
  .footer-inner {
    align-items: center;
    justify-content: center;
  }
}
</style>
