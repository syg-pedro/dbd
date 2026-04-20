import type { DemandStatus, Priority } from '~/types/domain'
import { DEMAND_STATUSES, PRIORITIES } from '~/types/domain'

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysIsoDate(days: number, from = new Date()) {
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function formatCurrencyFromCents(valueCents: number | null | undefined) {
  const value = (valueCents || 0) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const [year, month, day] = value.slice(0, 10).split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year.slice(2)}`
}

export function formatMinutes(minutes: number | null | undefined) {
  if (!minutes) return '-'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}min` : `${hours}h`
}

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function statusMeta(status: DemandStatus) {
  return DEMAND_STATUSES.find((item) => item.value === status) || DEMAND_STATUSES[0]
}

export function priorityLabel(priority: Priority) {
  return PRIORITIES.find((item) => item.value === priority)?.label || 'Media'
}
