export const FIELD_LIMITS = {
  email: 254,
  password: 72,
  personName: 80,
  phone: 15,
  client: 80,
  demand: 180,
  title: 120,
  search: 120,
  content: 2500,
  additional: 1200,
  notes: 1200,
  references: 2000,
  url: 500,
  linksPerDemand: 10,
  filesPerDemand: 5,
  fileSizeBytes: 10 * 1024 * 1024,
  moneyCents: 999_999_999,
  minutes: 99_999
} as const

export function limitText(value: string, maxLength: number) {
  return value.slice(0, maxLength)
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function maskBrazilianPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  const area = digits.slice(0, 2)
  const first = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6)
  const second = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10)

  if (digits.length <= 2) return area ? `(${area}` : ''
  if (!second) return `(${area}) ${first}`
  return `(${area}) ${first}-${second}`
}

export function parseCurrencyToCents(value: string) {
  const cents = Number(onlyDigits(value))
  if (!Number.isFinite(cents)) return 0
  return Math.min(cents, FIELD_LIMITS.moneyCents)
}

export function formatCurrencyInput(valueCents: number | null | undefined) {
  const cents = Math.min(Math.max(Number(valueCents || 0), 0), FIELD_LIMITS.moneyCents)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
    .format(cents / 100)
    .replace(/\u00a0/g, ' ')
}

export function clampInteger(value: number | string | null | undefined, max: number = FIELD_LIMITS.minutes) {
  const numeric = Number(onlyDigits(String(value ?? '')))
  if (!Number.isFinite(numeric)) return 0
  return Math.min(Math.max(numeric, 0), max)
}

export function normalizeUrl(value: string) {
  const url = limitText(value.trim(), FIELD_LIMITS.url)
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) return url
  return `https://${url}`
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
