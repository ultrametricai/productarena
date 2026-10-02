// @vitest-environment jsdom
// Keyboard behavior of the ⌘K palette: ArrowDown/ArrowUp move the active row FROM THE INPUT and
// cycle (wrap at both ends), Enter opens the active result, Escape closes. The filter itself is
// covered in lib/__tests__/search-matching.test.ts — these tests pin the interaction contract.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommandPalette from '@/components/CommandPalette'
import { loadCommandPaletteIndex } from '@/lib/command-palette-client'
import type { SearchEntry } from '@/lib/search-index'

vi.mock('@/lib/command-palette-client', () => ({ loadCommandPaletteIndex: vi.fn() }))
const loadIndex = vi.mocked(loadCommandPaletteIndex)
const INDEX_URL = '/search-index.json?v=first'
const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

// jsdom doesn't implement scrollIntoView (the palette calls it to keep the active row visible).
beforeEach(() => {
  push.mockClear()
  loadIndex.mockReset().mockResolvedValue(ENTRIES)
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

const ENTRIES: SearchEntry[] = [
  // Carries a house icon token (lib/arenaIcons.ts) — the palette must render it as the custom
  // duotone glyph, not as literal text (founder 2026-10-01 custom-icon upgrade).
  { type: 'arena', label: 'AI Coding Agents', sublabel: '8 products', href: '/arena/ai-coding', icon: 'pi:robot:violet' },
  { type: 'arena', label: 'Online Payments', sublabel: '6 products', href: '/arena/payments' },
  { type: 'page', label: 'Compare', sublabel: 'Any products, side by side', href: '/compare' },
  // Prefix-matches "jev" but only in a LATE group (products render after arenas when browsing) —
  // the direct-match hoist must still put it first (founder 2026-09-23).
  { type: 'product', label: 'Jev (TypeSafe AI)', sublabel: 'Frontier models', href: '/arena/frontier-models/product/jev', productId: 'jev' },
  { type: 'arena', label: 'Legal Ops', sublabel: 'jevons paradox of paperwork', href: '/arena/legal-ops' },
]

async function openPalette() {
  render(<CommandPalette indexUrl={INDEX_URL} />)
  fireEvent.click(screen.getByRole('button', { name: 'Open search' }))
  await screen.findByText('AI Coding Agents')
  return screen.getByPlaceholderText('Search arenas, products, stories…')
}

describe('CommandPalette keyboard navigation', () => {
  it('ArrowDown from the input moves the highlight and Enter opens the active result', async () => {
    const input = await openPalette()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/arena/payments')
  })

  it('cycles: ArrowDown wraps last → first, ArrowUp wraps first → last', async () => {
    const input = await openPalette()
    // 5 entries: 0 → 1 → 2 → 3 → 4 → wraps to 0
    for (let i = 0; i < 5; i++) fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenLastCalledWith('/arena/ai-coding')
  })

  it('ArrowUp from the top wraps to the last result', async () => {
    const input = await openPalette()
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'Enter' })
    // Browse order (empty query) is TYPE_ORDER: 3 arenas, then the page, then the product last.
    expect(push).toHaveBeenCalledWith('/arena/frontier-models/product/jev')
  })

  it('Escape closes the palette without navigating', async () => {
    const input = await openPalette()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByPlaceholderText('Search arenas, products, stories…')).toBeNull()
    expect(push).not.toHaveBeenCalled()
  })
})

describe('direct-match hoisting (founder 2026-09-23)', () => {
  it("querying 'jev' puts the label-prefix product FIRST even though arenas normally lead", async () => {
    const input = await openPalette()
    fireEvent.change(input, { target: { value: 'jev' } })
    // Enter opens the active (= first) result: the direct label match, not the sublabel-only arena.
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/arena/frontier-models/product/jev')
  })
})

describe('browse view Processes group (founder 2026-10-02)', () => {
  it('surfaces the pinned VS entry first and the full Processes group even when arenas fill the cap', async () => {
    // 45 arenas alone exceed MAX_RESULTS (40) — without reservation the process entries and
    // the VS pin would be sliced away before grouping.
    const manyArenas: SearchEntry[] = Array.from({ length: 45 }, (_, i) => ({
      type: 'arena' as const,
      label: `Arena ${i}`,
      sublabel: `${i} products`,
      href: `/arena/a${i}`,
    }))
    const entries: SearchEntry[] = [
      ...manyArenas,
      { type: 'process', label: 'All processes', sublabel: 'Every founder process', href: '/processes' },
      { type: 'process', label: 'Incorporate C-Corp', sublabel: 'Founder process · formation', href: '/processes/incorporate-c-corp' },
      { type: 'page', label: 'Open Startup Sim', sublabel: 'Simulate a startup journey', href: '/startup-sim' },
    ]
    loadIndex.mockResolvedValueOnce(entries)
    render(<CommandPalette indexUrl={INDEX_URL} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }))
    await screen.findByText('Open Startup Sim')
    // Pinned-first contract: the VS entry is row one.
    const rows = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-label') !== 'Open search')
    expect(rows[0].textContent).toContain('Open Startup Sim')
    // The Processes group header and both process rows render despite the arena flood.
    expect(screen.getByText('Processes')).toBeDefined()
    expect(screen.getByText('All processes')).toBeDefined()
    expect(screen.getByText('Incorporate C-Corp')).toBeDefined()
  })
})

describe('house icons in the palette (founder 2026-10-01)', () => {
  it('renders a `pi:` icon token as the custom duotone glyph, never as literal text', async () => {
    await openPalette()
    expect(document.querySelectorAll('svg[data-glyph="robot"]').length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toContain('pi:robot:violet')
  })
})


describe('shared index loading', () => {
  it('loads only on opening, accepts a query while pending, and does not show false no-matches', async () => {
    let resolve!: (entries: SearchEntry[]) => void
    loadIndex.mockReturnValueOnce(new Promise((done) => { resolve = done }))
    render(<CommandPalette indexUrl={INDEX_URL} />)
    expect(loadIndex).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const input = screen.getByPlaceholderText('Search arenas, products, stories…')
    expect(screen.getByRole('status', { name: 'Loading search' })).toBeDefined()
    expect(screen.queryByText(/No matches/)).toBeNull()
    fireEvent.change(input, { target: { value: 'jev' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).not.toHaveBeenCalled()
    await act(async () => resolve(ENTRIES))
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/arena/frontier-models/product/jev')
  })

  it('keeps successful entries visible on repeat opens and supports the Meta shortcut', async () => {
    const input = await openPalette()
    fireEvent.keyDown(input, { key: 'Escape' })
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByText('AI Coding Agents')).toBeDefined()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('retries a failed load by keyboard and keeps the query and input focus', async () => {
    loadIndex.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(ENTRIES)
    render(<CommandPalette indexUrl={INDEX_URL} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }))
    const input = screen.getByPlaceholderText('Search arenas, products, stories…')
    fireEvent.change(input, { target: { value: 'jev' } })
    const retry = await screen.findByRole('button', { name: 'Retry search' })
    fireEvent.keyDown(retry, { key: 'Enter' })
    await screen.findByText('Jev (TypeSafe AI)')
    expect(document.activeElement).toBe(input)
    expect(loadIndex).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/arena/frontier-models/product/jev')
  })

  it('does not let an old in-flight response replace a changed index version', async () => {
    let resolveOld!: (entries: SearchEntry[]) => void
    loadIndex.mockReturnValueOnce(new Promise((done) => { resolveOld = done }))
    const { rerender } = render(<CommandPalette indexUrl={INDEX_URL} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }))
    const newEntries: SearchEntry[] = [{ type: 'page', label: 'New index', sublabel: 'Updated', href: '/new' }]
    loadIndex.mockResolvedValueOnce(newEntries)
    rerender(<CommandPalette indexUrl="/search-index.json?v=second" />)
    await screen.findByText('New index')
    await act(async () => resolveOld(ENTRIES))
    expect(screen.queryByText('AI Coding Agents')).toBeNull()
    expect(screen.getByText('New index')).toBeDefined()
    expect(loadIndex).toHaveBeenLastCalledWith('/search-index.json?v=second')
  })
})
