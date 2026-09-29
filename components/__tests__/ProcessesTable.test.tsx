// @vitest-environment jsdom
// ProcessesTable's shareable-view URL params (founder 2026-09-21, lib/urlState.ts):
//   ?order=<preset>  the sort/ordering ('timeline' spells the timeOrder column; default pct elided)
//   ?phase=<phase>   phase filter ('all' elided)
//   ?pq=<text>       text filter (pq, NOT q — must coexist with MegaTable's ?q on the homepage)
// Contract per param: (a) present on mount → the view applies after hydration, (b) changing the
// control writes it, (c) the default state removes it; invalid values fall back silently.
// Since 2026-09-28 the no-param default is the GROUPED-BY-AREA view; any valid ?order= opens
// the flat sorted table (the param contract itself is unchanged).
import { act, fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ProcessesTable, { type PlaybookRow, type ProcessRow } from '@/components/ProcessesTable'
import { setGeoSelection } from '@/lib/geoPreference'

const PATH = '/'
const setUrl = (search: string) => window.history.replaceState(null, '', `${PATH}${search}`)
const params = () => new URLSearchParams(window.location.search)

function row(over: Pick<ProcessRow, 'slug' | 'title' | 'phase'> & Partial<ProcessRow>): ProcessRow {
  return {
    icon: '🏦',
    area: 'Starting up',
    areaRank: 0,
    geoScope: 'global',
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
    expect(thFor(container, 'Agent ceiling')?.getAttribute('aria-sort')).toBe('none')
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
    expect(thFor(container, 'Agent ceiling')?.getAttribute('aria-sort')).toBe('none')
    expect((within(container).getByLabelText('Filter by phase') as HTMLSelectElement).value).toBe('all')
  })

  it('?order=pct (never written by the UI) still opens the flat ceiling-sorted view', () => {
    setUrl('?order=pct')
    const { container } = mount()
    expect(within(container).queryByText('Starting up')).toBeNull() // flat, no area headers
    expect(thFor(container, 'Agent ceiling')?.getAttribute('aria-sort')).toBe('descending')
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
  it('renders area headers in lifecycle order with counts, rows in timeOrder within each area', () => {
    const { container } = mount()
    // Areas in AREA_ORDER (areaRank), rows re-sorted by timeOrder inside 'Starting up'
    // (incorporate timeOrder 1 before bank timeOrder 2, despite the array order).
    expect(bodyOrder(container)).toEqual([
      'Starting up', 'Incorporate the company', 'Open a bank account',
      'Growth & sales', 'Run payroll',
    ])
    // Header stats: count only (avg ceiling dropped — founder 2026-09-29).
    const startingUp = within(container).getByText('Starting up').closest('tr') as HTMLElement
    expect(startingUp.textContent).toContain('2 processes')
    expect(startingUp.textContent).not.toContain('%')
    const growth = within(container).getByText('Growth & sales').closest('tr') as HTMLElement
    expect(growth.textContent).toContain('1 process')
  })

  it('a rank-by preset switches to the flat sorted table; the reset pill returns to grouped and clears ?order=', () => {
    const { container, getByRole } = mount()
    fireEvent.click(getByRole('button', { name: 'Riskiest' }))
    expect(within(container).queryByText('Starting up')).toBeNull() // flat — headers gone
    expect(thFor(container, 'Risk')?.getAttribute('aria-sort')).toBe('descending')
    expect(params().get('order')).toBe('risk')

    fireEvent.click(getByRole('button', { name: /grouped by area/ }))
    expect(within(container).getByText('Starting up')).toBeDefined() // grouped again
    expect(thFor(container, 'Agent ceiling')?.getAttribute('aria-sort')).toBe('none')
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

describe('playbook rows in the combined table (founder 2026-09-29: one view under the search)', () => {
  function playbook(over: Pick<PlaybookRow, 'id' | 'title'> & Partial<PlaybookRow>): PlaybookRow {
    return {
      tagline: 'From zero to a running company',
      icon: '🚀',
      href: `/processes/chains/${over.id}`,
      // Titles deliberately distinct from ROWS' (IconChip renders its title as sr-only text —
      // colliding names would make textContent probes ambiguous).
      processes: [
        { id: 'pick-a-name', icon: '🏷️', title: 'Pick a company name', phase: 'Formation' },
        { id: 'file-delaware', icon: '🏛', title: 'File with Delaware', phase: 'Formation' },
      ],
      phases: ['Formation'],
      pct: 70,
      agentSteps: 7,
      totalSteps: 10,
      steps: [
        { label: 'File the charter', route: 'agent' as const, legalSignature: false },
        { label: 'Sign the incorporator consent', route: 'person' as const, legalSignature: true },
      ],
      ...over,
    }
  }
  const PLAYBOOKS: PlaybookRow[] = [playbook({ id: 'company-in-a-day', title: 'Company in a day' })]
  const mountWith = (playbooks = PLAYBOOKS) => render(<ProcessesTable rows={ROWS} phases={PHASES} playbooks={playbooks} />)
  const rowTexts = (root: HTMLElement) => [...root.querySelectorAll('tbody tr')].map((tr) => tr.textContent ?? '')

  it('grouped default: playbooks lead as their own group with count, before the areas', () => {
    const { container } = mountWith()
    const texts = rowTexts(container)
    const at = (probe: string) => texts.findIndex((t) => t.includes(probe))
    expect(at('Playbooks')).toBe(0)
    expect(at('Company in a day')).toBe(1)
    expect(at('Playbooks')).toBeLessThan(at('Starting up'))
    const header = within(container).getByText('Playbooks').closest('tr') as HTMLElement
    expect(header.textContent).toContain('1 end-to-end playbook')
    expect(header.textContent).not.toContain('%') // avg ceiling dropped (founder 2026-09-29)
  })

  it('a playbook row is visually distinct and links to its chain page: chip, route strip, honest metric dash', () => {
    const { container } = mountWith()
    const tr = within(container).getByText('Company in a day').closest('tr') as HTMLElement
    expect(within(tr).getByText('playbook')).toBeDefined() // the chip
    expect(within(tr).getByText('Company in a day').closest('a')?.getAttribute('href')).toBe('/processes/chains/company-in-a-day')
    expect(tr.textContent).toContain('7/10') // aggregate agent/total steps
    // The route strip: one dot per step, legalSignature wears violet.
    expect(within(tr).getByTitle('File the charter — agent-runnable')).toBeDefined()
    expect(within(tr).getByTitle('Sign the incorporator consent — legal signature (stays with a person)').className).toContain('bg-violet-400/80')
    // No timeline/cadence/risk value to show — the metric cell is an honest dash.
    expect(within(tr).getByText('—')).toBeDefined()
    // Process rows are unchanged next to it (their own links intact).
    expect(within(container).getByText('Run payroll').closest('a')?.getAttribute('href')).toBe('/processes/run-payroll')
  })

  it('a ceiling sort interleaves playbooks by their aggregate ceiling', () => {
    const { container, getByRole } = mountWith()
    fireEvent.click(getByRole('button', { name: 'Most automatable' }))
    const texts = rowTexts(container)
    const at = (probe: string) => texts.findIndex((t) => t.includes(probe))
    // pct desc: Run payroll 90 → playbook 70 → Incorporate 60 → bank 40.
    expect(at('Run payroll')).toBeLessThan(at('Company in a day'))
    expect(at('Company in a day')).toBeLessThan(at('Incorporate the company'))
    expect(within(container).queryByText('Playbooks')).toBeNull() // flat — the group header is gone
  })

  it('a per-process ordering (risk) lists playbooks after the sorted processes — missing values last', () => {
    const { container, getByRole } = mountWith()
    fireEvent.click(getByRole('button', { name: 'Riskiest' }))
    const texts = rowTexts(container)
    expect(texts.findIndex((t) => t.includes('Company in a day'))).toBe(texts.length - 1)
  })

  it('the phase filter scopes playbooks by their constituent processes; the text filter matches name and taglines', () => {
    const { container } = mountWith()
    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'Growth' } })
    expect(within(container).queryByText('Playbooks')).toBeNull() // no Formation-only playbook in Growth
    expect(within(container).queryByText('Company in a day')).toBeNull()
    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'Formation' } })
    expect(within(container).getByText('Company in a day')).toBeDefined()

    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'all' } })
    const search = within(container).getByLabelText('Filter products by name or vendor')
    fireEvent.change(search, { target: { value: 'zero to a running' } }) // the tagline
    expect(within(container).getByText('Company in a day')).toBeDefined()
    expect(within(container).queryByText('Run payroll')).toBeNull()
    fireEvent.change(search, { target: { value: 'zzz-no-match' } })
    expect(container.textContent).toContain('No processes or playbooks match')
  })

  it('without a playbooks prop the table renders exactly the process-only view (homepage co-mount)', () => {
    const { container } = mount()
    expect(within(container).queryByText('Playbooks')).toBeNull()
    expect(within(container).queryByText('playbook')).toBeNull()
  })
})

describe('geoScope glyphs under a geo selection (founder GEO ask 2026-09-28)', () => {
  // The module-level geo store outlives unmounts — always reset.
  afterEach(() => setGeoSelection(null))
  const GEO_ROWS: ProcessRow[] = [
    row({ slug: 'open-bank-account', title: 'Open a bank account', phase: 'Formation', geoScope: 'global' }),
    row({ slug: 'incorporate', title: 'Incorporate the company', phase: 'Formation', geoScope: 'us-state', timeOrder: 2 }),
    row({ slug: 'get-an-ein', title: 'Get an EIN', phase: 'Formation', geoScope: 'us', timeOrder: 3 }),
  ]

  it('no selection: no glyphs — the default view is untouched (rows and order unchanged)', () => {
    const { container } = render(<ProcessesTable rows={GEO_ROWS} phases={PHASES} />)
    // Scoped to the table body: the controls row carries a static 🌐 by the geo selector now.
    const body = container.querySelector('tbody') as HTMLElement
    for (const glyph of ['🌐', '🏛']) expect(body.textContent).not.toContain(glyph)
    expect(body.textContent).not.toContain('🇺🇸')
  })

  it('a non-US selection shows each row its scope glyph (🌐 / 🇺🇸 / 🏛) without re-sorting', () => {
    const { container } = render(<ProcessesTable rows={GEO_ROWS} phases={PHASES} />)
    act(() => setGeoSelection('UK'))
    const cells = [...container.querySelectorAll('tbody td:first-child')]
    const byTitle = (t: string) => cells.find((c) => c.textContent?.includes(t))
    expect(byTitle('Open a bank account')?.textContent).toContain('🌐')
    expect(byTitle('Incorporate the company')?.textContent).toContain('🏛')
    expect(byTitle('Get an EIN')?.textContent).toContain('🇺🇸')
    // Annotation only — the timeOrder grouping is exactly the no-selection order.
    expect(cells.map((c) => c.textContent?.includes('Open a bank account') ? 'bank' : c.textContent?.includes('Incorporate') ? 'inc' : 'ein')).toEqual(['bank', 'inc', 'ein'])
    act(() => setGeoSelection(null))
    expect((container.querySelector('tbody') as HTMLElement).textContent).not.toContain('🌐')
  })
})
