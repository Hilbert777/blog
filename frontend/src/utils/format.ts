export function formatDate(value?: string) {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

export function truncateText(value = '', max = 120) {
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

export function normalizeKeyword(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}
