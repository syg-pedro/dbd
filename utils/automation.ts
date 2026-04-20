import type { Demand, DemandForm, DemandType, Priority } from '~/types/domain'
import { addDaysIsoDate, normalizeText } from '~/utils/format'

const TYPE_KEYWORDS: Array<{ type: string; words: string[] }> = [
  { type: 'Story', words: ['story', 'stories', 'storie'] },
  { type: 'Feed', words: ['feed', 'post', 'postagem', 'card'] },
  { type: 'Reels', words: ['reels', 'reel', 'short', 'tiktok'] },
  { type: 'Video', words: ['video', 'animacao', 'motion'] },
  { type: 'Banner', words: ['banner', 'capa', 'header'] },
  { type: 'Landing Page', words: ['landing', 'pagina', 'site'] },
  { type: 'Logo', words: ['logo', 'marca', 'identidade'] },
  { type: 'Carrossel', words: ['carrossel', 'carousel', 'carrossel'] },
  { type: 'Flyer', words: ['flyer', 'panfleto', 'folder'] },
  { type: 'Apresentacao', words: ['apresentacao', 'slides', 'deck'] }
]

const HIGH_PRIORITY_WORDS = ['urgente', 'hoje', 'amanha', 'agora', 'rapido', 'prioridade']
const LOW_PRIORITY_WORDS = ['sem pressa', 'quando der', 'proximo mes', 'depois']
const DEFAULT_TYPE_VALUES: Record<string, { valueCents: number; minutes: number; deadlineDays: number }> = {
  feed: { valueCents: 2000, minutes: 45, deadlineDays: 3 },
  story: { valueCents: 1600, minutes: 30, deadlineDays: 2 },
  carrossel: { valueCents: 20000, minutes: 180, deadlineDays: 5 },
  reels: { valueCents: 25000, minutes: 180, deadlineDays: 4 },
  video: { valueCents: 35000, minutes: 240, deadlineDays: 6 },
  banner: { valueCents: 3000, minutes: 60, deadlineDays: 2 },
  flyer: { valueCents: 10000, minutes: 120, deadlineDays: 4 },
  'landing page': { valueCents: 30000, minutes: 300, deadlineDays: 7 },
  logo: { valueCents: 40000, minutes: 360, deadlineDays: 8 },
  apresentacao: { valueCents: 50000, minutes: 300, deadlineDays: 6 }
}

export function inferDemandType(text: string, types: DemandType[] = []) {
  const normalized = normalizeText(text)
  const match = TYPE_KEYWORDS.find((item) => item.words.some((word) => normalized.includes(word)))
  if (!match) return types[0]?.name || 'Feed'

  const existingType = types.find((type) => normalizeText(type.name) === normalizeText(match.type))
  return existingType?.name || match.type
}

export function makeShortTitle(client: string, request: string, typeName?: string) {
  const clientInitials = client
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((piece) => piece[0]?.toUpperCase())
    .join('')

  const cleaned = request
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 4)
    .join(' ')

  const suffix = cleaned || typeName || 'Demanda'
  return `${clientInitials || client.slice(0, 2).toUpperCase()} - ${suffix}`.slice(0, 80)
}

export function suggestPriority(request: string): Priority {
  const normalized = normalizeText(request)
  if (HIGH_PRIORITY_WORDS.some((word) => normalized.includes(word))) return 'high'
  if (LOW_PRIORITY_WORDS.some((word) => normalized.includes(word))) return 'low'
  return 'medium'
}

export function suggestDueDate(priority: Priority, typeName: string, types: DemandType[] = []) {
  const type = types.find((item) => normalizeText(item.name) === normalizeText(typeName))
  if (type?.default_deadline_days) return addDaysIsoDate(type.default_deadline_days)
  const fallback = DEFAULT_TYPE_VALUES[normalizeText(typeName)]
  if (fallback) return addDaysIsoDate(fallback.deadlineDays)
  if (priority === 'high') return addDaysIsoDate(1)
  if (priority === 'low') return addDaysIsoDate(7)
  return addDaysIsoDate(3)
}

export function applyDemandAutomation(
  form: DemandForm,
  types: DemandType[] = []
): DemandForm {
  const source = `${form.client} ${form.original_request} ${form.content}`.trim()
  const typeName = form.type_name || inferDemandType(source, types)
  const type = types.find((item) => normalizeText(item.name) === normalizeText(typeName))
  const fallbackType = DEFAULT_TYPE_VALUES[normalizeText(typeName)]
  const suggestedPriority = suggestPriority(source)
  const priority = form.priority === 'medium' ? suggestedPriority : form.priority

  return {
    ...form,
    type_id: form.type_id || type?.id || null,
    type_name: typeName,
    title: form.title || makeShortTitle(form.client, form.original_request, typeName),
    priority,
    due_at: form.due_at || suggestDueDate(priority, typeName, types),
    value_cents: form.value_cents || type?.default_value_cents || fallbackType?.valueCents || 0,
    spent_minutes: form.spent_minutes || type?.default_minutes || fallbackType?.minutes || 0
  }
}

export function findSimilarDemands(current: DemandForm, demands: Demand[]) {
  const tokens = normalizeText(`${current.client} ${current.title} ${current.original_request}`)
    .split(/\s+/)
    .filter((token) => token.length > 3)

  return demands
    .filter((demand) => demand.id !== current.id)
    .map((demand) => {
      const haystack = normalizeText(`${demand.client} ${demand.title} ${demand.original_request} ${demand.type_name}`)
      const score =
        tokens.filter((token) => haystack.includes(token)).length +
        (normalizeText(demand.client) === normalizeText(current.client) ? 2 : 0) +
        (normalizeText(demand.type_name) === normalizeText(current.type_name) ? 1 : 0)
      return { demand, score }
    })
    .filter((item) => item.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.demand)
}

export function duplicateDemandPayload(demand: Demand) {
  return {
    status: 'inbox',
    client: demand.client,
    type_id: demand.type_id,
    type_name: demand.type_name,
    title: `${demand.title} copia`.slice(0, 90),
    original_request: demand.original_request,
    content: demand.content,
    additional: demand.additional,
    notes: demand.notes,
    references_text: demand.references_text,
    priority: demand.priority,
    requester_id: demand.requester_id,
    designer_id: demand.designer_id,
    artwork_url: null,
    requested_at: new Date().toISOString().slice(0, 10),
    due_at: null,
    delivery_at: null,
    posting_at: null,
    value_cents: demand.value_cents,
    spent_minutes: demand.spent_minutes,
    completed_at: null
  }
}
