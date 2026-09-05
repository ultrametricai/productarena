import { describe, expect, it } from 'vitest'
import { CLOSE_CALL_DELTA, pickTop } from '../pick'
import type { LeaderboardEntry, Product } from '../types'

const entry = (productId: string, over: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  productId,
  score: 50,
  agentReady: null,
  agenticApp: null,
  apiQuality: null,
  aiEra: null,
  applicable: 10,
  total: 10,
  themeScores: {},
  ...over,
})

const product = (id: string, type: Product['type'] = 'commercial'): Product => ({
  id,
  name: id.toUpperCase(),
  vendor: `${id} inc`,
  type,
  urls: { site: `https://${id}.example` },
})

const PRODUCTS = [product('a'), product('b', 'oss'), product('c', 'oss')]

describe('pickTop', () => {
  it('ranks by the metric, not leaderboard order, and reports field size', () => {
    const result = pickTop(
      [entry('a', { agentReady: 40 }), entry('b', { agentReady: 62 }), entry('c', { agentReady: 10 })],
      PRODUCTS,
      'agentReady',
    )
    expect(result.top).toMatchObject({ productId: 'b', rank: 1, value: 62 })
    expect(result.runnerUp).toMatchObject({ productId: 'a', value: 40 })
    expect(result.fieldSize).toBe(3)
    expect(result.tooClose).toBe(false)
    expect(result.delta).toBe(22)
  })

  it('drops products with a null value on the metric', () => {
    const result = pickTop([entry('a', { agentReady: 40 }), entry('b')], PRODUCTS, 'agentReady')
    expect(result.fieldSize).toBe(1)
    expect(result.runnerUp).toBeNull()
    expect(result.delta).toBeNull()
    expect(result.tooClose).toBe(false)
  })

  it('reads arenaScore from the aiEra field', () => {
    const result = pickTop([entry('a', { aiEra: 31.1 }), entry('b', { aiEra: 28.2 })], PRODUCTS, 'arenaScore')
    expect(result.top?.productId).toBe('a')
    expect(result.top?.value).toBe(31.1)
    expect(result.delta).toBe(2.9)
    expect(result.tooClose).toBe(true)
  })

  it('flags a close race exactly at the 3.0 threshold (same convention as lib/uncertainty.ts)', () => {
    expect(CLOSE_CALL_DELTA).toBe(3.0)
    const at = pickTop([entry('a', { agentReady: 30 }), entry('b', { agentReady: 27 })], PRODUCTS, 'agentReady')
    expect(at.tooClose).toBe(true)
    const over = pickTop([entry('a', { agentReady: 30.5 }), entry('b', { agentReady: 27 })], PRODUCTS, 'agentReady')
    expect(over.delta).toBe(3.5)
    expect(over.tooClose).toBe(false)
  })

  it('rounds delta to one decimal so float noise cannot flip the tie call', () => {
    const result = pickTop([entry('a', { agentReady: 30.1 }), entry('b', { agentReady: 27.0999 })], PRODUCTS, 'agentReady')
    expect(result.delta).toBe(3.0)
    expect(result.tooClose).toBe(true)
  })

  it('ossOnly restricts the field (rank and runner-up shift)', () => {
    const result = pickTop(
      [entry('a', { agentReady: 90 }), entry('b', { agentReady: 62 }), entry('c', { agentReady: 60 })],
      PRODUCTS,
      'agentReady',
      { ossOnly: true },
    )
    expect(result.top?.productId).toBe('b')
    expect(result.runnerUp?.productId).toBe('c')
    expect(result.fieldSize).toBe(2)
    expect(result.tooClose).toBe(true) // Δ2.0
  })

  it('returns null top for an empty field', () => {
    const result = pickTop([entry('a')], PRODUCTS, 'agentReady', { ossOnly: true })
    expect(result.top).toBeNull()
    expect(result.fieldSize).toBe(0)
  })
})
