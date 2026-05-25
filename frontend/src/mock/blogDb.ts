import { ElMessage } from 'element-plus'

import type { Article, ArticlePayload, ArticleQuery, Category, DashboardStats, LoginResult, PageData, UserInfo } from '@/types/blog'
import { getToken } from '@/utils/token'
import { importedPosts } from './importedPosts'

interface MockUser extends UserInfo {
  password: string
}

interface MockDb {
  version: number
  users: MockUser[]
  categories: Category[]
  articles: Article[]
  lastCategoryId: number
  lastArticleId: number
}

// localStorage 中的模拟数据库 key；版本号变化时会重新生成默认数据。
const DB_KEY = 'blog_frontend_mock_db_v2'
// 模拟后台登录 token 的前缀，用于区分本项目生成的本地 token。
const TOKEN_PREFIX = 'mock-blog-token'

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function parseListValue(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
  }
  return trimmed ? [trimmed.replace(/^['"]|['"]$/g, '')] : []
}

// 解析旧博客 Markdown 的 front matter，提取标题、日期、分类和正文。
function readFrontMatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const body = match ? raw.slice(match[0].length).trim() : raw.trim()
  const frontMatter = match?.[1] || ''
  const title = frontMatter.match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '')
  const date = frontMatter.match(/^(?:date|data:date):\s*(.+)$/m)?.[1]?.trim()
  const categoriesValue = frontMatter.match(/^categories:\s*(.+)$/m)?.[1] || '文章'
  const categories = parseListValue(categoriesValue)
  return {
    title,
    date,
    categories: categories.length ? categories : ['文章'],
    body,
  }
}

// 从 Markdown 正文中提取纯文本摘要，去掉代码块、图片、链接和 Markdown 标记。
function buildSummary(content: string) {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)

  if (!plain) return '从 HilbertBlog 搬运的历史文章。'
  return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain
}

// 首次打开项目或本地数据版本过期时，生成默认管理员、分类和文章数据。
function seedDb(): MockDb {
  const createdAt = now()
  const parsedPosts = importedPosts.map((post) => ({
    ...readFrontMatter(post.raw),
    filename: post.filename,
  }))
  const categoryNames = Array.from(new Set(['前端', ...parsedPosts.flatMap((post) => post.categories)]))
  const categories = categoryNames.map<Category>((name, index) => ({
    id: index + 1,
    name,
    createdAt,
  }))
  const categoryIdMap = new Map(categories.map((category) => [category.name, category.id]))
  const defaultCategoryId = categoryIdMap.get('前端') || 1
  const importedArticles = parsedPosts.map<Article>((post, index) => {
    const categoryName = post.categories[0] || '文章'
    const articleCreatedAt = post.date || createdAt
    return {
      id: index + 3,
      title: post.title || post.filename.replace(/\.md$/i, ''),
      summary: buildSummary(post.body),
      content: post.body,
      categoryId: categoryIdMap.get(categoryName) || defaultCategoryId,
      categoryName,
      cover: '',
      status: 'published',
      createdAt: articleCreatedAt,
      updatedAt: articleCreatedAt,
    }
  })

  return {
    version: 2,
    users: [
      {
        id: 1,
        username: 'admin',
        password: '123456',
        nickname: '管理员',
        role: 'admin',
      },
    ],
    categories,
    articles: [
      {
        id: 1,
        title: 'Vue 3 与 Vite 项目实践',
        summary: '使用 Vue 3、Vite、TypeScript 搭建博客前台页面，并通过组件拆分提升可维护性。',
        content:
          "# Vue 3 与 Vite 项目实践\n\n这篇文章介绍博客前台的工程结构、组件拆分和路由设计。\n\n```ts\nconst stack = ['Vue 3', 'Vite', 'TypeScript']\n```\n\n- 页面使用路由懒加载\n- 请求统一由 API 模块处理\n- 登录态由 Pinia 管理",
        categoryId: defaultCategoryId,
        categoryName: '前端',
        cover: '',
        status: 'published',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 2,
        title: '前端本地 Mock 接口方案',
        summary: '用 localStorage 模拟数据库，让登录、文章管理和分类管理在纯前端环境中完整演示。',
        content:
          '# 前端本地 Mock 接口方案\n\n前端实践项目可以使用 localStorage 保存文章、分类和登录态。\n\n> 页面继续调用 API 函数，但 API 内部不再请求后端服务。\n\n这样既保留了真实项目的分层结构，也降低了运行环境复杂度。',
        categoryId: defaultCategoryId,
        categoryName: '前端',
        cover: '',
        status: 'published',
        createdAt,
        updatedAt: createdAt,
      },
      ...importedArticles,
    ],
    lastCategoryId: categories.length,
    lastArticleId: importedArticles.length + 2,
  }
}

// 读取 localStorage 中的 Mock 数据；结构不兼容时自动重置为最新种子数据。
function loadDb(): MockDb {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const db = seedDb()
    saveDb(db)
    return db
  }

  try {
    const db = JSON.parse(raw) as MockDb
    if (db.version === 2 && Array.isArray(db.categories) && Array.isArray(db.articles)) {
      return db
    }
  } catch {
    localStorage.removeItem(DB_KEY)
  }

  const db = seedDb()
  saveDb(db)
  return db
}

function saveDb(db: MockDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

// 模拟异步接口延迟，让页面 loading、表单提交等交互更接近真实请求。
function run<T>(task: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      try {
        resolve(task())
      } catch (error) {
        const message = error instanceof Error ? error.message : '操作失败'
        ElMessage.error(message)
        reject(error)
      }
    }, 180)
  })
}

// 后台写操作前统一校验登录状态，模拟真实后端的管理员权限保护。
function assertAdmin() {
  const token = getToken()
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    throw new Error('登录已过期，请重新登录')
  }
}

function userToInfo(user: MockUser): UserInfo {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    role: user.role,
  }
}

function getCategoryName(db: MockDb, categoryId: number) {
  return db.categories.find((item) => item.id === categoryId)?.name || '未分类'
}

// 文章返回前统一补齐分类名，并按列表/详情场景决定是否返回正文内容。
function normalizeArticle(db: MockDb, article: Article, includeContent: boolean): Article {
  return {
    ...article,
    content: includeContent ? article.content || '' : undefined,
    categoryName: getCategoryName(db, article.categoryId),
  }
}

// 统一处理文章分页、发布状态过滤、分类筛选和关键词搜索。
function pageArticles(db: MockDb, query: ArticleQuery, onlyPublished: boolean): PageData<Article> {
  const pageNum = Math.max(Number(query.pageNum || 1), 1)
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 50)
  const keyword = (query.keyword || '').trim().toLowerCase()
  const categoryId = query.categoryId ? Number(query.categoryId) : 0
  const status = query.status || ''

  let list = [...db.articles]
  if (onlyPublished) {
    list = list.filter((item) => item.status === 'published')
  } else if (status) {
    list = list.filter((item) => item.status === status)
  }
  if (categoryId) {
    list = list.filter((item) => item.categoryId === categoryId)
  }
  if (keyword) {
    list = list.filter((item) => {
      const categoryName = getCategoryName(db, item.categoryId).toLowerCase()
      return (
        item.title.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword) ||
        (item.content || '').toLowerCase().includes(keyword) ||
        categoryName.includes(keyword)
      )
    })
  }

  list.sort((a, b) => b.id - a.id)
  const total = list.length
  const start = (pageNum - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize).map((item) => normalizeArticle(db, item, false)),
    total,
    pageNum,
    pageSize,
  }
}

// 分类名称校验：禁止空名称和重复名称，编辑时排除当前分类自身。
function assertCategoryNameAvailable(db: MockDb, name: string, currentId?: number) {
  const normalized = name.trim()
  if (!normalized) {
    throw new Error('请输入分类名称')
  }
  const exists = db.categories.some((item) => item.name === normalized && item.id !== currentId)
  if (exists) {
    throw new Error('分类名称已存在')
  }
}

// 文章保存前做字段校验，保证后台新增和编辑写入的数据结构完整。
function assertArticlePayload(db: MockDb, payload: ArticlePayload) {
  if (!payload.title.trim()) throw new Error('请输入标题')
  if (!payload.summary.trim()) throw new Error('请输入摘要')
  if (!payload.categoryId) throw new Error('请选择分类')
  if (!payload.content.trim()) throw new Error('Markdown 正文不能为空')
  if (!['draft', 'published'].includes(payload.status)) throw new Error('请选择正确的文章状态')
  if (!db.categories.some((item) => item.id === Number(payload.categoryId))) {
    throw new Error('分类不存在')
  }
}

// 模拟登录接口：校验本地管理员账号密码，成功后返回 token 和用户信息。
export function mockLogin(payload: { username: string; password: string }) {
  return run<LoginResult>(() => {
    const db = loadDb()
    const user = db.users.find((item) => item.username === payload.username && item.password === payload.password)
    if (!user) {
      throw new Error('账号或密码错误')
    }
    return {
      token: `${TOKEN_PREFIX}-${user.username}-${Date.now()}`,
      userInfo: userToInfo(user),
    }
  })
}

// 模拟“获取当前用户”接口，路由守卫和后台布局会用它恢复用户信息。
export function mockCurrentUser() {
  return run<UserInfo>(() => {
    assertAdmin()
    const db = loadDb()
    return userToInfo(db.users[0])
  })
}

// 前台和后台共用分类列表读取接口。
export function mockGetCategories() {
  return run<Category[]>(() => {
    const db = loadDb()
    return [...db.categories].sort((a, b) => a.id - b.id)
  })
}

// 后台新增分类接口，写入 localStorage 后返回新分类。
export function mockCreateCategory(payload: { name: string }) {
  return run<Category>(() => {
    assertAdmin()
    const db = loadDb()
    assertCategoryNameAvailable(db, payload.name)
    const category: Category = {
      id: db.lastCategoryId + 1,
      name: payload.name.trim(),
      createdAt: now(),
    }
    db.lastCategoryId = category.id
    db.categories.push(category)
    saveDb(db)
    return category
  })
}

// 后台编辑分类接口，同时同步更新已关联文章上的分类名。
export function mockUpdateCategory(id: number, payload: { name: string }) {
  return run<Category>(() => {
    assertAdmin()
    const db = loadDb()
    const category = db.categories.find((item) => item.id === id)
    if (!category) throw new Error('分类不存在')
    assertCategoryNameAvailable(db, payload.name, id)
    category.name = payload.name.trim()
    db.articles = db.articles.map((article) =>
      article.categoryId === id ? { ...article, categoryName: category.name, updatedAt: now() } : article,
    )
    saveDb(db)
    return category
  })
}

// 后台删除分类接口；如果分类下仍有文章，则拒绝删除。
export function mockDeleteCategory(id: number) {
  return run<null>(() => {
    assertAdmin()
    const db = loadDb()
    if (db.articles.some((item) => item.categoryId === id)) {
      throw new Error('该分类下仍有关联文章，不能删除')
    }
    db.categories = db.categories.filter((item) => item.id !== id)
    saveDb(db)
    return null
  })
}

// 前台文章列表接口，只返回已发布文章。
export function mockGetArticles(params: ArticleQuery) {
  return run<PageData<Article>>(() => pageArticles(loadDb(), params, true))
}

// 后台文章列表接口，可按草稿/已发布状态查看全部文章。
export function mockGetAdminArticles(params: ArticleQuery) {
  return run<PageData<Article>>(() => {
    assertAdmin()
    return pageArticles(loadDb(), params, false)
  })
}

// 文章详情接口：前台只允许查看已发布文章，后台编辑场景可读取草稿。
export function mockGetArticle(id: number | string, admin = false) {
  return run<Article>(() => {
    if (admin) assertAdmin()
    const db = loadDb()
    const article = db.articles.find((item) => item.id === Number(id))
    if (!article || (!admin && article.status !== 'published')) {
      throw new Error('文章不存在')
    }
    return normalizeArticle(db, article, true)
  })
}

// 后台新增文章接口，保存 Markdown 正文、摘要、分类和发布状态。
export function mockCreateArticle(payload: ArticlePayload) {
  return run<Article>(() => {
    assertAdmin()
    const db = loadDb()
    assertArticlePayload(db, payload)
    const createdAt = now()
    const article: Article = {
      id: db.lastArticleId + 1,
      title: payload.title.trim(),
      summary: payload.summary.trim(),
      content: payload.content.trim(),
      categoryId: Number(payload.categoryId),
      categoryName: getCategoryName(db, Number(payload.categoryId)),
      cover: payload.cover?.trim() || '',
      status: payload.status,
      createdAt,
      updatedAt: createdAt,
    }
    db.lastArticleId = article.id
    db.articles.push(article)
    saveDb(db)
    return normalizeArticle(db, article, true)
  })
}

// 后台编辑文章接口，保留原创建时间，只更新内容和 updatedAt。
export function mockUpdateArticle(id: number | string, payload: ArticlePayload) {
  return run<Article>(() => {
    assertAdmin()
    const db = loadDb()
    assertArticlePayload(db, payload)
    const index = db.articles.findIndex((item) => item.id === Number(id))
    if (index < 0) throw new Error('文章不存在')
    const existed = db.articles[index]
    const article: Article = {
      ...existed,
      title: payload.title.trim(),
      summary: payload.summary.trim(),
      content: payload.content.trim(),
      categoryId: Number(payload.categoryId),
      categoryName: getCategoryName(db, Number(payload.categoryId)),
      cover: payload.cover?.trim() || '',
      status: payload.status,
      updatedAt: now(),
    }
    db.articles[index] = article
    saveDb(db)
    return normalizeArticle(db, article, true)
  })
}

// 后台删除文章接口，从 localStorage 的文章数组中移除对应记录。
export function mockDeleteArticle(id: number | string) {
  return run<null>(() => {
    assertAdmin()
    const db = loadDb()
    const before = db.articles.length
    db.articles = db.articles.filter((item) => item.id !== Number(id))
    if (db.articles.length === before) throw new Error('文章不存在')
    saveDb(db)
    return null
  })
}

// 后台仪表盘统计接口，直接基于本地文章和分类数据计算。
export function mockDashboardStats() {
  return run<DashboardStats>(() => {
    assertAdmin()
    const db = loadDb()
    return {
      articleTotal: db.articles.length,
      publishedTotal: db.articles.filter((item) => item.status === 'published').length,
      draftTotal: db.articles.filter((item) => item.status === 'draft').length,
      categoryTotal: db.categories.length,
    }
  })
}
