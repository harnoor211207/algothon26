export function createId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export function nowIso() {
  return new Date().toISOString()
}

export function formatDate(iso) {
  if (!iso) return 'Never'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDuration(ms) {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function getByPath(obj, path) {
  if (!path) return undefined
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

export function setByPath(obj, path, value) {
  const keys = String(path).split('.').filter(Boolean)
  if (!keys.length) return obj
  const clone = structuredClone(obj ?? {})
  let cursor = clone
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value
    } else {
      if (typeof cursor[key] !== 'object' || cursor[key] == null) cursor[key] = {}
      cursor = cursor[key]
    }
  })
  return clone
}

export function interpolate(template, data) {
  if (template == null) return ''
  return String(template).replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, path) => {
    const value = getByPath(data, path.trim())
    if (value == null) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  })
}

export function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function clone(value) {
  return structuredClone(value)
}
