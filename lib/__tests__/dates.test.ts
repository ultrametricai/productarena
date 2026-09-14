import { describe, expect, it } from 'vitest'
import { shortDate } from '@/lib/dates'

describe('shortDate', () => {
  it('always carries the year (founder rule: "Sep 1" alone is ambiguous)', () => {
    expect(shortDate('2026-09-01')).toBe("Sep 1 '26")
  })

  it('accepts full ISO timestamps and formats in UTC', () => {
    expect(shortDate('2026-01-02T23:59:00Z')).toBe("Jan 2 '26")
  })

  it('zero-pads single-digit year remainders', () => {
    expect(shortDate('2107-03-05')).toBe("Mar 5 '07")
  })
})
