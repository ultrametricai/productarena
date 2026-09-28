// @vitest-environment jsdom
// ProcessesTable's shareable-view URL params (founder 2026-09-21, lib/urlState.ts):
//   ?order=<preset>  the sort/ordering ('timeline' spells the timeOrder column; default pct elided)
//   ?phase=<phase>   phase filter ('all' elided)
//   ?pq=<text>       text filter (pq, NOT q — must coexist with MegaTable's ?q on the homepage)
// Contract per param: (a) present on mount → the view applies after hydration, (b) changing the
// control writes it, (c) the default state removes it; invalid values fall back silently.
// Since 2026-09-28 the no-param default is the GROUPED-BY-AREA view; any valid ?order= opens
// the flat sorted table (the param contract itself is unchanged).
import { fireEvent, render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ProcessesTable, { type ProcessRow } from '@/components/ProcessesTable'

const PATH = '/productarena/'
const setUrl = (search: string) => window.history.replaceState(null, '', `${PATH}${search}`)
const params = () => new URLSearchParams(window.location.search)

function row(over: Pick<ProcessRow, 'slug' | 'title' | 'phase'> & Partial<ProcessRow>): ProcessRow {
  return {
    icon: '🏦',
    area: 'Starting up',
    areaRank: 0,
    pct: 50,
    agentSteps: 2,
    totalSteps: 4,
    complexity: 'medium',
    timeOrder: 1,
    cadenceLabel: 'Monthly',
    cadenceRank: 3,
    annoyance: 3,
    risk: 3,
    growthImpact: 3,
    vendors: [{ id: 'mercury', label: 'Mercury', arena: 'startup-banking', hasLogo: false }],
    ...over,
  }
}

// Two areas; 'Starting up' holds two rows deliberately OUT of timeOrder in the array (bank
// timeOrder 2 before incorporate timeOrder 1) so the grouped view's within-area ordering is
// proven, not inherited. 'Growth & sales' (rank 8) comes after 'Starting up' (rank 0).
const ROWS: ProcessRow[] = [
  row({ slug: 'open-bank-account', title: 'Open a bank account', phase: 'Formation', risk: 5, timeOrder: 2, pct: 40 }),
  row({ slug: 'run-payroll', title: 'Run payroll', phase: 'Growth', area: 'Growth & sales', areaRank: 8, risk: 2, timeOrder: 5, pct: 90 }),
  row({ slug: 'incorporate', title: 'Incorporate the company', phase: 'Formation', risk: 4, timeOrder: 1, pct: 60 }),
]
const PHASES = ['Formation', 'Growth']

// The visual order of the grouped table: area headers and row titles as they appear top-to-bottom.
const bodyOrder = (root: HTMLElement) =>
  [...root.querySelectorAll('tbody tr')].map((tr) => {
    for (const probe of ['Starting up', 'Growth & sales', 'Open a bank account', 'Run payroll', 'Incorporate the company']) {
      if (tr.textContent?.includes(probe)) return probe
    }
    return '?'
  })

const mount = () => render(<ProcessesTable rows={ROWS} phases={PHASES} />)

const thFor = (root: HTMLElement, label: string) =>
  within(root).getAllByText(label).map((el) => el.closest('th')).find((th) => th !== null) ?? null

beforeEach(() => setUrl(''))

describe('mount applies URL params (invalids fall back silently)', () => {
  it('pristine URL renders the default view: grouped by area, no column sorted, all phases', () => {
    const { container } = mount()
    expect(within(container).getByText('Starting up')).toBeDefined()
    expect(thFor(container, 'Current agent ceiling')?.getAttribute('aria-sort')).toBe('none')
    expect((within(container).getByLabelText('Filter by phase') as HTMLSelectElement).value).toBe('all')
  })

  it('?order=risk sorts by risk in its preset direction (desc)', () => {
    setUrl('?order=risk')
    const { container } = mount()
    expect(thFor(container, 'Risk')?.getAttribute('aria-sort')).toBe('descending')
    const titles = within(container).getAllByText(/Open a bank account|Run payroll/).map((el) => el.textContent)
    expect(titles.indexOf('Open a bank account')).toBeLessThan(titles.indexOf('Run payroll')) // risk 5 first
  })

  it("?order=timeline maps to the timeOrder column (ascending — the founder's journey)", () => {
    setUrl('?order=timeline')
    const { container } = mount()
    expect(thFor(container, 'Timeline')?.getAttribute('aria-sort')).toBe('ascending')
  })

  it('?phase= and ?pq= apply the phase filter and search box', () => {
    setUrl('?phase=Growth&pq=payroll')
    const { container } = mount()
    expect((within(container).getByLabelText('Filter by phase') as HTMLSelectElement).value).toBe('Growth')
    expect((within(container).getByLabelText('Filter products by name or vendor') as HTMLInputElement).value).toBe('payroll')
    expect(within(container).queryByText('Open a bank account')).toBeNull()
    expect(within(container).getByText('Run payroll')).toBeDefined()
  })

  it('invalid ?order/?phase fall back to the defaults (the grouped view), silently', () => {
    setUrl('?order=vibes&phase=Retirement')
    const { container } = mount()
    expect(within(container).getByText('Starting up')).toBeDefined() // still grouped
    expect(thFor(container, 'Current agent ceiling')?.getAttribute('aria-sort')).toBe('none')
    expect((within(container).getByLabelText('Filter by phase') as HTMLSelectElement).value).toBe('all')
  })

  it('?order=pct (never written by the UI) still opens the flat ceiling-sorted view', () => {
    setUrl('?order=pct')
    const { container } = mount()
    expect(within(container).queryByText('Starting up')).toBeNull() // flat, no area headers
    expect(thFor(container, 'Current agent ceiling')?.getAttribute('aria-sort')).toBe('descending')
  })
})

describe('interactions write params; defaults remove them', () => {
  it('an ordering preset writes ?order=, and the default preset removes it', () => {
    const { getByRole } = mount()
    fireEvent.click(getByRole('button', { name: 'Riskiest' }))
    expect(params().get('order')).toBe('risk')
    fireEvent.click(getByRole('button', { name: 'Founder timeline' }))
    expect(params().get('order')).toBe('timeline') // human-readable alias, not order=order
    fireEvent.click(getByRole('button', { name: 'Most automatable' })) // the default sort — param gone
    expect(params().get('order')).toBeNull()
  })

  it('the phase <select> and the in-row phase button write ?phase=; All/again clears it', () => {
    const { container } = mount()
    const select = within(container).getByLabelText('Filter by phase')
    fireEvent.change(select, { target: { value: 'Formation' } })
    expect(params().get('phase')).toBe('Formation')
    fireEvent.change(select, { target: { value: 'all' } })
    expect(params().get('phase')).toBeNull()

    const phaseButton = within(container).getByTitle(/click to filter to Growth/)
    fireEvent.click(phaseButton)
    expect(params().get('phase')).toBe('Growth')
    fireEvent.click(within(container).getByTitle(/click to clear the phase filter/))
    expect(params().get('phase')).toBeNull()
  })

  it('the search box writes ?pq= and clears it when emptied', () => {
    const { container } = mount()
    const input = within(container).getByLabelText('Filter products by name or vendor')
    fireEvent.change(input, { target: { value: 'bank' } })
    expect(params().get('pq')).toBe('bank')
    fireEvent.change(input, { target: { value: '' } })
    expect(params().get('pq')).toBeNull()
  })

  it("patches, never rebuilds: MegaTable's ?rank/?q and HomeModes' ?view survive (homepage co-mount)", () => {
    setUrl('?view=processes&rank=popularity&q=stripe')
    const { getByRole } = mount()
    fireEvent.click(getByRole('button', { name: 'Growth-focused' }))
    const p = params()
    expect(p.get('view')).toBe('processes')
    expect(p.get('rank')).toBe('popularity')
    expect(p.get('q')).toBe('stripe')
    expect(p.get('order')).toBe('growth')
  })
})

describe('grouped-by-area default view (founder 2026-09-28)', () => {
  it('renders area headers in lifecycle order with counts + avg ceiling, rows in timeOrder within each area', () => {
    const { container } = mount()
    // Areas in AREA_ORDER (areaRank), rows re-sorted by timeOrder inside 'Starting up'
    // (incorporate timeOrder 1 before bank timeOrder 2, despite the array order).
    expect(bodyOrder(container)).toEqual([
      'Starting up', 'Incorporate the company', 'Open a bank account',
      'Growth & sales', 'Run payroll',
    ])
    // Header stats: count + the area's average agent ceiling as a quiet stat.
    const startingUp = within(container).getByText('Starting up').closest('tr') as HTMLElement
    expect(startingUp.textContent).toContain('2 processes')
    expect(startingUp.textContent).toContain('50%') // (40 + 60) / 2
    const growth = within(container).getByText('Growth & sales').closest('tr') as HTMLElement
    expect(growth.textContent).toContain('1 process')
    expect(growth.textContent).toContain('90%')
  })

  it('a rank-by preset switches to the flat sorted table; the reset pill returns to grouped and clears ?order=', () => {
    const { container, getByRole } = mount()
    fireEvent.click(getByRole('button', { name: 'Riskiest' }))
    expect(within(container).queryByText('Starting up')).toBeNull() // flat — headers gone
    expect(thFor(container, 'Risk')?.getAttribute('aria-sort')).toBe('descending')
    expect(params().get('order')).toBe('risk')

    fireEvent.click(getByRole('button', { name: /grouped by area/ }))
    expect(within(container).getByText('Starting up')).toBeDefined() // grouped again
    expect(thFor(container, 'Current agent ceiling')?.getAttribute('aria-sort')).toBe('none')
    expect(params().get('order')).toBeNull()
  })

  it('a column-header sort also flattens (grouping and cross-corpus sorting cannot coexist)', () => {
    const { container } = mount()
    const processTh = thFor(container, 'Process') as HTMLElement
    fireEvent.click(within(processTh).getByRole('button'))
    expect(within(container).queryByText('Starting up')).toBeNull()
    expect(processTh.getAttribute('aria-sort')).toBe('ascending') // title's preset direction
    expect(params().get('order')).toBe('title')
  })

  it('the phase filter collapses the grouped view to the matching area(s)', () => {
    const { container } = mount()
    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'Formation' } })
    expect(within(container).getByText('Starting up')).toBeDefined()
    expect(within(container).queryByText('Growth & sales')).toBeNull()
    expect(within(container).queryByText('Run payroll')).toBeNull()
    expect(params().get('phase')).toBe('Formation') // URL contract untouched in the grouped view
  })
})
