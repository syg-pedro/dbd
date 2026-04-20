import { describe, expect, it } from 'vitest'
import {
  applyDemandAutomation,
  duplicateDemandPayload,
  inferDemandType,
  makeShortTitle,
  suggestPriority
} from '../utils/automation'
import type { Demand } from '../types/domain'

describe('demand automation', () => {
  it('creates a compact title from client and request', () => {
    expect(makeShortTitle('Academia PowerFit', 'post whey promocao para hoje')).toBe('AP - post whey promocao para')
  })

  it('infers demand type from keywords', () => {
    expect(inferDemandType('preciso de stories de depoimentos')).toBe('Story')
    expect(inferDemandType('novo banner institucional')).toBe('Banner')
  })

  it('suggests priority from urgency words', () => {
    expect(suggestPriority('preciso disso urgente hoje')).toBe('high')
    expect(suggestPriority('sem pressa, pode ser depois')).toBe('low')
  })

  it('fills missing automation fields without overwriting explicit values', () => {
    const result = applyDemandAutomation({
      status: 'inbox',
      client: 'Cafe Central',
      type_id: null,
      type_name: '',
      title: '',
      original_request: 'post feed inauguracao',
      content: '',
      additional: '',
      notes: '',
      references_text: '',
      priority: 'medium',
      requester_id: null,
      designer_id: null,
      artwork_url: '',
      requested_at: '2026-04-20',
      due_at: '',
      delivery_at: '',
      posting_at: '',
      value_cents: 0,
      spent_minutes: 0,
      links: []
    })

    expect(result.type_name).toBe('Feed')
    expect(result.title).toContain('CC -')
    expect(result.due_at).toBeTruthy()
  })

  it('duplicates a demand while clearing workflow fields', () => {
    const demand = {
      id: '1',
      owner_id: 'user',
      status: 'done',
      client: 'Loja Pet Feliz',
      type_id: null,
      type_name: 'Story',
      title: 'LP - Story campanha',
      original_request: 'story campanha',
      content: null,
      additional: null,
      notes: null,
      references_text: null,
      priority: 'medium',
      requester_id: null,
      designer_id: null,
      artwork_url: 'https://drive.google.com/file',
      requested_at: '2026-04-20',
      due_at: '2026-04-21',
      delivery_at: '2026-04-22',
      posting_at: '2026-04-23',
      value_cents: 8000,
      spent_minutes: 30,
      created_at: '2026-04-20T00:00:00Z',
      updated_at: '2026-04-20T00:00:00Z',
      completed_at: '2026-04-21T00:00:00Z'
    } satisfies Demand

    const duplicate = duplicateDemandPayload(demand)
    expect(duplicate.status).toBe('inbox')
    expect(duplicate.due_at).toBeNull()
    expect(duplicate.completed_at).toBeNull()
    expect(duplicate.artwork_url).toBeNull()
    expect(duplicate.client).toBe(demand.client)
  })
})
