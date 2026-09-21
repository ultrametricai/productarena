// @vitest-environment jsdom
// MegaTable's shareable-view URL params (founder 2026-09-21, lib/urlState.ts):
//   ?rank=<column>  sort column (default agentReady elided)
//   ?dir=asc|desc   only when it differs from the column's own default direction
//   ?arena=<id>     arena scope ('all' elided)
//   ?all=1          "Include all products of companies" (off elided)
//   ?q=<text>       text filter (empty elided)
// Contract per param: (a) present on mount → the view applies after hydration, (b) changing the
// control writes it, (c) the default state removes it; invalid values fall back silently.
import { fireEvent, render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import MegaTable from '@/components/MegaTable'
import type { MegaTableRow } from '@/lib/megaTableSort'

const PATH = '/productarena/'
const setUrl = (search: string) => window.history.replaceState(null, '', `${PATH}${search}`)
const params = () => new URLSearchParams(window.location.search)

const GLYPH = { char: '—', className: 'text-zinc-600', title: 'none found', href: '/methodology' }

function row(
  over: Pick<MegaTableRow, 'productId' | 'name' | 'arenaId' | 'arenaName'> & Partial<MegaTableRow>,
): MegaTableRow {
  return {
    vendor: over.name,
    type: 'commercial',
    hasLogo: false,
    initScore: 50,
    agentReady: 50,
    agenticApp: 50,
    apiQuality: 50,
    apiUntested: false,
    popularity: null,
    access: { MCP: GLYPH, CLI: GLYPH, API: GLYPH },
    ...over,
  }
}

const ROWS: MegaTableRow[] = [
  row({ productId: 'stripe', name: 'Stripe', arenaId: 'payments', arenaName: 'Payments', agentReady: 90, initScore: 40 }),
  row({ productId: 'stripe-issuing', name: 'Stripe Issuing', arenaId: 'payments', arenaName: 'Payments', isFamilySubProduct: true }),
  row({ productId: 'notion', name: 'Notion', arenaId: 'docs', arenaName: 'Docs', agentReady: 30, initScore: 95 }),
]
const ARENAS = [
  { id: 'payments', name: 'Payments' },
  { id: 'docs', name: 'Docs' },
]

const mount = () => render(<MegaTable rows={ROWS} arenas={ARENAS} />)

const thFor = (root: HTMLElement, label: string) =>
  within(root).getAllByText(label).map((el) => el.closest('th')).find((th) => th !== null) ?? null

beforeEach(() => setUrl(''))

describe('mount applies URL params (invalids fall back silently)', () => {
  it('pristine URL renders the default view: AGENT-READY desc, all arenas', () => {
    const { container } = mount()
    expect(thFor(container, 'Agent-ready')?.getAttribute('aria-sort')).toBe('descending')
    expect((within(container).getByLabelText('Filter by arena') as HTMLSelectElement).value).toBe('all')
  })

  it('?rank=initScore&dir=asc sorts by PA Score ascending', () => {
    setUrl('?rank=initScore&dir=asc')
    const { container } = mount()
    expect(thFor(container, 'PA Score')?.getAttribute('aria-sort')).toBe('ascending')
    // Ascending PA Score puts Stripe (40) before Notion (95).
    const names = within(container).getAllByText(/^(Stripe|Notion)$/).map((el) => el.textContent)
    expect(names.indexOf('Stripe')).toBeLessThan(names.indexOf('Notion'))
  })

  it('?arena=<id>, ?all=1 and ?q= apply the scope, sub-product toggle and text filter', () => {
    setUrl('?arena=payments&all=1&q=stripe')
    const { container } = mount()
    expect((within(container).getByLabelText('Filter by arena') as HTMLSelectElement).value).toBe('payments')
    expect((within(container).getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
    expect((within(container).getByLabelText('Filter products by name or vendor') as HTMLInputElement).value).toBe('stripe')
    expect(within(container).queryByText('Notion')).toBeNull()
    expect(within(container).getByText('Stripe Issuing')).toBeDefined() // all=1 reveals the sub-product
  })

  it('invalid ?rank/?dir/?arena fall back to the defaults, silently', () => {
    setUrl('?rank=bogus&dir=sideways&arena=nope')
    const { container } = mount()
    expect(thFor(container, 'Agent-ready')?.getAttribute('aria-sort')).toBe('descending')
    expect((within(container).getByLabelText('Filter by arena') as HTMLSelectElement).value).toBe('all')
  })
})

describe('interactions write params; defaults remove them', () => {
  it('a rank-by preset writes ?rank=, and the default preset removes it', () => {
    const { getByText } = mount()
    fireEvent.click(getByText('Most popular'))
    expect(params().get('rank')).toBe('popularity')
    fireEvent.click(getByText('Highest PA Score'))
    expect(params().get('rank')).toBe('initScore')
    fireEvent.click(getByText('Most agent-ready')) // the default sort — param gone
    expect(params().get('rank')).toBeNull()
  })

  it('toggling the current column writes ?dir= only when non-default', () => {
    const { container } = mount()
    const header = within(thFor(container, 'Agent-ready') as HTMLElement).getByRole('button')
    fireEvent.click(header) // agentReady was active desc → now asc (non-default)
    expect(params().get('dir')).toBe('asc')
    expect(params().get('rank')).toBeNull() // still the default column
    fireEvent.click(header) // back to desc — the default — param gone
    expect(params().get('dir')).toBeNull()
  })

  it('arena scope, sub-product toggle and text filter write and clear their params', () => {
    const { container } = mount()
    const select = within(container).getByLabelText('Filter by arena')
    fireEvent.change(select, { target: { value: 'docs' } })
    expect(params().get('arena')).toBe('docs')
    fireEvent.change(select, { target: { value: 'all' } })
    expect(params().get('arena')).toBeNull()

    const checkbox = within(container).getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(params().get('all')).toBe('1')
    fireEvent.click(checkbox)
    expect(params().get('all')).toBeNull()

    const input = within(container).getByLabelText('Filter products by name or vendor')
    fireEvent.change(input, { target: { value: 'notion' } })
    expect(params().get('q')).toBe('notion')
    fireEvent.change(input, { target: { value: '' } })
    expect(params().get('q')).toBeNull()
  })

  it('patches, never rebuilds: co-mounted params (?view, ?order) survive a sort click', () => {
    setUrl('?view=processes&order=risk')
    const { getByText } = mount()
    fireEvent.click(getByText('Most popular'))
    expect(params().get('view')).toBe('processes')
    expect(params().get('order')).toBe('risk')
    expect(params().get('rank')).toBe('popularity')
  })
})
