// @vitest-environment jsdom
// Keyboard behavior of the ⌘K palette: ArrowDown/ArrowUp move the active row FROM THE INPUT and
// cycle (wrap at both ends), Enter opens the active result, Escape closes. The filter itself is
// covered in lib/__tests__/search-matching.test.ts — these tests pin the interaction contract.
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommandPalette from '@/components/CommandPalette'
import type { SearchEntry } from '@/lib/search-index'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

// jsdom doesn't implement scrollIntoView (the palette calls it to keep the active row visible).
beforeEach(() => {
  push.mockClear()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

const ENTRIES: SearchEntry[] = [
  { type: 'arena', label: 'AI Coding Agents', sublabel: '8 products', href: '/arena/ai-coding' },
  { type: 'arena', label: 'Online Payments', sublabel: '6 products', href: '/arena/payments' },
  { type: 'page', label: 'Compare', sublabel: 'Any products, side by side', href: '/compare' },
  // Prefix-matches "jev" but only in a LATE group (products render after arenas when browsing) —
  // the direct-match hoist must still put it first (founder 2026-09-23).
  { type: 'product', label: 'Jev (TypeSafe AI)', sublabel: 'Frontier models', href: '/arena/frontier-models/product/jev', productId: 'jev' },
  { type: 'arena', label: 'Legal Ops', sublabel: 'jevons paradox of paperwork', href: '/arena/legal-ops' },
]

function openPalette() {
  render(<CommandPalette entries={ENTRIES} />)
  fireEvent.click(screen.getByRole('button', { name: 'Open search' }))
  return screen.getByPlaceholderText('Search arenas, products, stories…')
}

describe('CommandPalette keyboard navigation', () => {
  it('ArrowDown from the input moves the highlight and Enter opens the active result', () => {
    const input = openPalette()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/arena/payments')
  })

  it('cycles: ArrowDown wraps last → first, ArrowUp wraps first → last', () => {
    const input = openPalette()
    // 5 entries: 0 → 1 → 2 → 3 → 4 → wraps to 0
    for (let i = 0; i < 5; i++) fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenLastCalledWith('/arena/ai-coding')
  })

  it('ArrowUp from the top wraps to the last result', () => {
    const input = openPalette()
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'Enter' })
    // Browse order (empty query) is TYPE_ORDER: 3 arenas, then the page, then the product last.
    expect(push).toHaveBeenCalledWith('/arena/frontier-models/product/jev')
  })

  it('Escape closes the palette without navigating', () => {
    const input = openPalette()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByPlaceholderText('Search arenas, products, stories…')).toBeNull()
    expect(push).not.toHaveBeenCalled()
  })
})

describe('direct-match hoisting (founder 2026-09-23)', () => {
  it("querying 'jev' puts the label-prefix product FIRST even though arenas normally lead", () => {
    const input = openPalette()
    fireEvent.change(input, { target: { value: 'jev' } })
    // Enter opens the active (= first) result: the direct label match, not the sublabel-only arena.
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/arena/frontier-models/product/jev')
  })
})
