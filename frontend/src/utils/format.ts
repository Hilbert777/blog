export function formatDate(value?: string) {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

// 文本截断工具，用于列表摘要等固定长度展示场景。
export function truncateText(value = '', max = 120) {
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

// 路由 query 可能是数组或 undefined，这里统一清洗成搜索关键词字符串。
export function normalizeKeyword(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}
