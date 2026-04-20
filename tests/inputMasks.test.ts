import { describe, expect, it } from 'vitest'
import {
  FIELD_LIMITS,
  clampInteger,
  formatCurrencyInput,
  isValidHttpUrl,
  limitText,
  maskBrazilianPhone,
  normalizeUrl,
  parseCurrencyToCents
} from '../utils/inputMasks'

describe('input masks and limits', () => {
  it('limits text by the configured length', () => {
    expect(limitText('x'.repeat(200), FIELD_LIMITS.client)).toHaveLength(FIELD_LIMITS.client)
  })

  it('formats Brazilian mobile and landline phones', () => {
    expect(maskBrazilianPhone('11987654321')).toBe('(11) 98765-4321')
    expect(maskBrazilianPhone('1133334444')).toBe('(11) 3333-4444')
  })

  it('parses and formats BRL currency as cents', () => {
    expect(parseCurrencyToCents('R$ 1.234,56')).toBe(123456)
    expect(formatCurrencyInput(123456)).toBe('R$ 1.234,56')
  })

  it('clamps integer-only fields', () => {
    expect(clampInteger('12abc34', 500)).toBe(500)
    expect(clampInteger('', 500)).toBe(0)
  })

  it('normalizes and validates http links', () => {
    expect(normalizeUrl('example.com/ref')).toBe('https://example.com/ref')
    expect(isValidHttpUrl('https://example.com/ref')).toBe(true)
    expect(isValidHttpUrl(normalizeUrl('ftp://example.com/ref'))).toBe(false)
    expect(isValidHttpUrl('ftp://example.com/ref')).toBe(false)
  })
})
