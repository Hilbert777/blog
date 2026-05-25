<template>
  <main class="login-page">
    <section class="login-card">
      <div class="login-title">
        <span class="login-mark">B</span>
        <div>
          <h1>后台登录</h1>
          <p>Blog Admin</p>
        </div>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" autocomplete="current-password" show-password />
        </el-form-item>
        <el-button class="login-button" type="primary" :loading="loading" @click="submit">
          <LogIn :size="17" />
          登录
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { LogIn } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function submit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await authStore.login(form)
    ElMessage.success('登录成功')
    router.push(String(route.query.redirect || '/admin/dashboard'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.13), rgba(15, 118, 110, 0.1)),
    #f8fafc;
}

.login-card {
  width: min(420px, 100%);
  padding: 30px;
  border: 1px solid #dbe4ef;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
}

.login-title {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 22px;
}

.login-mark {
  display: inline-grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  background: #2563eb;
  font-size: 22px;
  font-weight: 900;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
}

p {
  margin: 4px 0 0;
  color: #64748b;
}

.login-button {
  width: 100%;
  margin-top: 6px;
}

.login-button :deep(span) {
  gap: 8px;
}

.login-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
}
</style>
