<template>
  <el-form ref="formRef" class="article-form" :model="form" :rules="rules" label-width="86px">
    <el-form-item label="标题" prop="title">
      <el-input v-model="form.title" maxlength="150" show-word-limit />
    </el-form-item>
    <el-form-item label="摘要" prop="summary">
      <el-input v-model="form.summary" type="textarea" :rows="3" maxlength="255" show-word-limit />
    </el-form-item>
    <div class="form-grid">
      <el-form-item label="分类" prop="categoryId">
        <div class="category-field">
          <el-select v-model="form.categoryId" placeholder="选择分类" filterable>
            <el-option v-for="item in categoryStore.categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-input v-model="newCategoryName" placeholder="自定义分类" maxlength="50" />
          <el-button native-type="button" :loading="categorySaving" @click="createCategory">
            <Plus :size="16" />
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio-button label="draft">草稿</el-radio-button>
          <el-radio-button label="published">发布</el-radio-button>
        </el-radio-group>
      </el-form-item>
    </div>
    <el-form-item label="封面" prop="cover">
      <el-input v-model="form.cover" placeholder="可选，填写图片 URL" />
    </el-form-item>
    <el-form-item label="正文" prop="content">
      <MdEditor v-model="form.content" language="zh-CN" preview-theme="github" style="height: 520px" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        <Save :size="16" />
        保存
      </el-button>
      <el-button @click="$router.back()">返回</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import { Plus, Save } from 'lucide-vue-next'

import { createCategoryApi } from '@/api/category'
import { useCategoryStore } from '@/stores/category'
import type { ArticlePayload } from '@/types/blog'

const props = defineProps<{
  initialValue?: ArticlePayload
  submitLoading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: ArticlePayload]
}>()

const categoryStore = useCategoryStore()
const formRef = ref<FormInstance>()
const newCategoryName = ref('')
const categorySaving = ref(false)
const form = reactive<ArticlePayload>({
  title: '',
  summary: '',
  content: '',
  categoryId: '',
  cover: '',
  status: 'draft',
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  summary: [{ required: true, message: '请输入摘要', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入正文', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

watch(
  () => props.initialValue,
  (value) => {
    if (!value) return
    Object.assign(form, value)
  },
  { immediate: true },
)

onMounted(() => {
  if (!categoryStore.categories.length) {
    categoryStore.fetchCategories()
  }
})

async function handleSubmit() {
  await formRef.value?.validate()
  if (!String(form.content).trim()) {
    ElMessage.error('Markdown 正文不能为空')
    return
  }
  emit('submit', { ...form, categoryId: Number(form.categoryId) })
}

async function createCategory() {
  const name = newCategoryName.value.trim()
  if (!name) {
    ElMessage.error('请输入自定义分类名称')
    return
  }

  categorySaving.value = true
  try {
    const category = await createCategoryApi({ name })
    await categoryStore.fetchCategories()
    form.categoryId = category.id
    newCategoryName.value = ''
    ElMessage.success('分类已创建')
  } finally {
    categorySaving.value = false
  }
}
</script>

<style scoped>
.article-form {
  max-width: 1120px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.category-field {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(130px, 180px) 40px;
  gap: 8px;
  width: 100%;
}

.article-form :deep(.el-button span) {
  gap: 6px;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .category-field {
    grid-template-columns: 1fr;
  }

  .article-form :deep(.el-form-item__label) {
    justify-content: flex-start;
  }
}
</style>
