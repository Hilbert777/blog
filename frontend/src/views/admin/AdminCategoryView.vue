<template>
  <section class="admin-page">
    <div class="page-toolbar">
      <h1 class="admin-title">分类管理</h1>
      <el-button type="primary" @click="openCreate">
        <Plus :size="16" />
        新增分类
      </el-button>
    </div>

    <div class="admin-panel">
      <el-table v-loading="loading" :data="categories" row-key="id">
        <el-table-column prop="name" label="分类名称" min-width="220" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="openEdit(row)">
              <Pencil :size="15" />
              编辑
            </el-button>
            <el-button text type="danger" @click="remove(row.id)">
              <Trash2 :size="15" />
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '新增分类'" width="420px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="82px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'

import { createCategoryApi, deleteCategoryApi, updateCategoryApi } from '@/api/category'
import { useCategoryStore } from '@/stores/category'
import type { Category } from '@/types/blog'
import { formatDate } from '@/utils/format'

const categoryStore = useCategoryStore()
const categories = computed(() => categoryStore.categories)
const loading = computed(() => categoryStore.loading)
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
})
const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

categoryStore.fetchCategories()

function openCreate() {
  editingId.value = null
  form.name = ''
  dialogVisible.value = true
}

function openEdit(row: Category) {
  editingId.value = row.id
  form.name = row.name
  dialogVisible.value = true
}

async function save() {
  await formRef.value?.validate()
  saving.value = true
  try {
    if (editingId.value) {
      await updateCategoryApi(editingId.value, { name: form.name.trim() })
    } else {
      await createCategoryApi({ name: form.name.trim() })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await categoryStore.fetchCategories()
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  await ElMessageBox.confirm('确定删除这个分类吗？有关联文章时后端会拒绝删除。', '删除确认', { type: 'warning' })
  await deleteCategoryApi(id)
  ElMessage.success('删除成功')
  await categoryStore.fetchCategories()
}
</script>

<style scoped>
.page-toolbar :deep(.el-button span),
.admin-panel :deep(.el-button span) {
  gap: 6px;
}
</style>
