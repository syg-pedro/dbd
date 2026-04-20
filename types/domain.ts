export const DEMAND_STATUSES = [
  { value: 'inbox', label: 'Inbox', shortLabel: 'Inbox', tone: 'neutral' },
  { value: 'today', label: 'Hoje', shortLabel: 'Hoje', tone: 'warn' },
  { value: 'later', label: 'Depois', shortLabel: 'Depois', tone: 'neutral' },
  { value: 'done', label: 'Concluido', shortLabel: 'Ok', tone: 'ok' },
  { value: 'blocked', label: 'Travado', shortLabel: 'Travado', tone: 'danger' }
] as const

export const PRIORITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' }
] as const

export const PERSON_ROLES = [
  { value: 'requester', label: 'Solicitante' },
  { value: 'designer', label: 'Designer' }
] as const

export type DemandStatus = (typeof DEMAND_STATUSES)[number]['value']
export type Priority = (typeof PRIORITIES)[number]['value']
export type PersonRole = (typeof PERSON_ROLES)[number]['value']

export interface Person {
  id: string
  owner_id: string
  name: string
  role: PersonRole
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DemandType {
  id: string
  owner_id: string
  name: string
  slug: string
  default_value_cents: number
  default_minutes: number
  default_deadline_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DemandLink {
  id: string
  demand_id: string
  owner_id: string
  label: string | null
  url: string
  kind: 'reference' | 'artwork'
  created_at: string
}

export interface DemandFile {
  id: string
  demand_id: string
  owner_id: string
  file_name: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  signed_url?: string
  created_at: string
}

export interface Demand {
  id: string
  owner_id: string
  status: DemandStatus
  client: string
  type_id: string | null
  type_name: string
  title: string
  original_request: string
  content: string | null
  additional: string | null
  notes: string | null
  references_text: string | null
  priority: Priority
  requester_id: string | null
  designer_id: string | null
  artwork_url: string | null
  requested_at: string
  due_at: string | null
  delivery_at: string | null
  posting_at: string | null
  value_cents: number
  spent_minutes: number
  created_at: string
  updated_at: string
  completed_at: string | null
  demand_links?: DemandLink[]
  demand_files?: DemandFile[]
}

export type DemandForm = {
  id?: string
  status: DemandStatus
  client: string
  type_id: string | null
  type_name: string
  title: string
  original_request: string
  content: string
  additional: string
  notes: string
  references_text: string
  priority: Priority
  requester_id: string | null
  designer_id: string | null
  artwork_url: string
  requested_at: string
  due_at: string
  delivery_at: string
  posting_at: string
  value_cents: number
  spent_minutes: number
  links: string[]
}

export type PersonForm = {
  id?: string
  name: string
  role: PersonRole
  email: string
  phone: string
  is_active: boolean
}
