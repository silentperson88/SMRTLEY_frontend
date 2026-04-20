export const AS_OF_DATE_STORAGE_KEY = 'stock-as-of-date'

const pad = (value: number) => String(value).padStart(2, '0')

export const getTodayIsoDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const normalizeAsOfDate = (value?: string | null) => {
  const text = String(value || '').trim()
  if (!text) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null

  const parsed = new Date(`${text}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null

  return text
}

export const getStoredAsOfDate = () => {
  if (typeof window === 'undefined') return getTodayIsoDate()
  const normalized = normalizeAsOfDate(window.localStorage.getItem(AS_OF_DATE_STORAGE_KEY))
  return normalized || getTodayIsoDate()
}

export const setStoredAsOfDate = (value: string) => {
  if (typeof window === 'undefined') return
  const normalized = normalizeAsOfDate(value) || getTodayIsoDate()
  window.localStorage.setItem(AS_OF_DATE_STORAGE_KEY, normalized)
}

const MARKET_API_PREFIXES = ['ticker/activestock', 'ticker/fundamentals', 'ticker/eod']

export const shouldAttachAsOfDate = (url?: string, method?: string) => {
  const normalizedUrl = String(url || '').replace(/^\/+/, '')
  const normalizedMethod = String(method || 'get').toLowerCase()
  if (normalizedMethod !== 'get') return false
  return MARKET_API_PREFIXES.some(prefix => normalizedUrl.startsWith(prefix))
}
