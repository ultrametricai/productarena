// lib/ordinal.ts — rank positions read as English ordinals (founder 2026-10-02). The teens are
// the classic trap: 11th/12th/13th, not 11st/12nd/13rd.
import { describe, expect, it } from 'vitest'
import { ordinal } from '@/lib/ordinal'

describe('ordinal', () => {
  it('1st, 2nd, 3rd, 4th — the leaderboard head', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
    expect(ordinal(10)).toBe('10th')
  })

  it('the teens are all -th (11th, 12th, 13th), including above 100', () => {
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
    expect(ordinal(111)).toBe('111th')
    expect(ordinal(112)).toBe('112th')
    expect(ordinal(113)).toBe('113th')
  })

  it('21st, 22nd, 23rd, 101st — the units digit rules outside the teens', () => {
    expect(ordinal(21)).toBe('21st')
    expect(ordinal(22)).toBe('22nd')
    expect(ordinal(23)).toBe('23rd')
    expect(ordinal(24)).toBe('24th')
    expect(ordinal(101)).toBe('101st')
    expect(ordinal(100)).toBe('100th')
  })

  it('degrades sanely on edge inputs (0, fractions truncate — ranks are integers)', () => {
    expect(ordinal(0)).toBe('0th')
    expect(ordinal(2.9)).toBe('2nd')
  })
})
