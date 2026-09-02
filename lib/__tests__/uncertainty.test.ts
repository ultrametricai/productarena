import { describe, expect, it } from 'vitest'
import { agreementOf, isCloseRace, isUncertain } from '@/lib/uncertainty'

describe('agreementOf', () => {
  it('is 3/3 when all three judgments agree', () => {
    expect(agreementOf(['full', 'full', 'full'])).toBe('3/3')
  })

  it('is 2/3 for a 2-1 split, regardless of which slot dissents', () => {
    expect(agreementOf(['full', 'full', 'partial'])).toBe('2/3')
    expect(agreementOf(['partial', 'full', 'full'])).toBe('2/3')
    expect(agreementOf(['full', 'partial', 'full'])).toBe('2/3')
  })

  it('is 1/3 when all three judgments disagree', () => {
    expect(agreementOf(['full', 'partial', 'none'])).toBe('1/3')
  })

  it('treats na and none as distinct tiers', () => {
    expect(agreementOf(['na', 'none', 'none'])).toBe('2/3')
  })
})

describe('isCloseRace', () => {
  it('is true when the gap is within the threshold', () => {
    expect(isCloseRace(31.1, 28.2, 3.0)).toBe(true)
  })

  it('is true exactly at the threshold', () => {
    expect(isCloseRace(30, 27, 3.0)).toBe(true)
  })

  it('is false when the gap exceeds the threshold', () => {
    expect(isCloseRace(41.1, 37.8, 3.0)).toBe(false)
  })

  it('is false when either score is null', () => {
    expect(isCloseRace(null, 10, 3.0)).toBe(false)
    expect(isCloseRace(10, null, 3.0)).toBe(false)
    expect(isCloseRace(null, null, 3.0)).toBe(false)
  })

  it('is symmetric regardless of argument order', () => {
    expect(isCloseRace(28.2, 31.1, 3.0)).toBe(true)
  })

  it('defaults threshold to 3.0', () => {
    expect(isCloseRace(30, 27.1)).toBe(true)
    expect(isCloseRace(30, 26.9)).toBe(false)
  })
})

describe('isUncertain', () => {
  it('is false for a stable 3/3', () => {
    expect(isUncertain('3/3')).toBe(false)
  })

  it('is true for a split', () => {
    expect(isUncertain('2/3')).toBe(true)
    expect(isUncertain('1/3')).toBe(true)
  })

  it('is false when no entry was recorded at all', () => {
    expect(isUncertain(undefined)).toBe(false)
  })
})
