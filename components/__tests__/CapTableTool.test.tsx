// @vitest-environment jsdom
// Smoke + interaction contract for /tools/cap-table's client half. The math itself is
// exhaustively covered in lib/openstartup/__tests__/capTable.test.ts — these tests pin
// that the tool renders the waterfall from ?ct= (or the default scenario), reacts to
// edits, and surfaces engine errors instead of crashing.
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CapTableTool from '@/components/CapTableTool'
import type { CapTableEvent } from '@/lib/openstartup/capTable'
import { encodeCapTableState } from '@/lib/openstartup/capTableCodec'

let ctParam: string | null = null
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => (key === 'ct' ? ctParam : null) }),
}))

describe('CapTableTool', () => {
  it('renders the default scenario waterfall (found → SAFE → priced round)', () => {
    ctParam = null
    render(<CapTableTool />)
    // "Founding" also labels the event editor card, so target the snapshot heading.
    expect(screen.getByRole('heading', { name: 'Founding' })).toBeDefined()
    expect(screen.getByText('SAFE: Angel SAFE')).toBeDefined()
    expect(screen.getByText('Priced round: Series Seed')).toBeDefined()
    // Default founding: 4,250,000 + 4,250,000 + 1,500,000 pool = 10,000,000 FD
    // (appears on both the founding and SAFE snapshots — a SAFE issues no shares)
    expect(screen.getAllByText('10,000,000 FD shares')).toHaveLength(2)
    // Export affordances show their payloads (house rule: copied text is visible)
    expect(screen.getByText('Preview: CSV (final table)')).toBeDefined()
    expect(screen.getByText('Preview: markdown (full waterfall)')).toBeDefined()
  })

  it('restores a shared scenario from ?ct=', () => {
    const events: CapTableEvent[] = [
      { kind: 'found', founders: [{ name: 'Solo founder', shares: 9_000_000 }], poolShares: 1_000_000 },
      { kind: 'safe', name: 'Uncle Vern', amount: 100_000, cap: 2_000_000 },
    ]
    ctParam = encodeCapTableState(events)
    render(<CapTableTool />)
    expect(screen.getByText('SAFE: Uncle Vern')).toBeDefined()
    expect(screen.getByText('Uncle Vern (SAFE, as-converted est.)')).toBeDefined()
    // 100k / 2m post-money cap = 5.00% as-converted estimate
    expect(screen.getAllByText('5.00%').length).toBeGreaterThan(0)
  })

  it('falls back to the default scenario on a malformed ?ct=', () => {
    ctParam = '!!!broken token!!!'
    render(<CapTableTool />)
    expect(screen.getByText('SAFE: Angel SAFE')).toBeDefined()
  })

  it('adds a SAFE event from the toolbar', () => {
    ctParam = null
    render(<CapTableTool />)
    fireEvent.click(screen.getByRole('button', { name: '+ SAFE' }))
    expect(screen.getByText('SAFE: SAFE 2')).toBeDefined()
  })

  it('surfaces engine errors as an alert instead of crashing', () => {
    // A SAFE whose amount reaches its post-money cap sells 100%+ of the company.
    const events: CapTableEvent[] = [
      { kind: 'found', founders: [{ name: 'F', shares: 1_000_000 }] },
      { kind: 'safe', name: 'Too big', amount: 5_000_000, cap: 5_000_000 },
    ]
    ctParam = encodeCapTableState(events)
    render(<CapTableTool />)
    expect(screen.getByRole('alert').textContent).toMatch(/100%/)
    // The founding snapshot before the failing event still renders
    expect(screen.getByRole('heading', { name: 'Founding' })).toBeDefined()
  })
})
