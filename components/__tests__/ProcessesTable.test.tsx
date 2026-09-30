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


// The rank-by presets live in ONE dropdown now (founder 2026-09-30) — open it, pick the option.
const pickPreset = (scope: { getByRole: (role: string, opts?: object) => HTMLElement }, label: string) => {
  fireEvent.click(scope.getByRole('button', { name: /Rank by|Most automatable|Most steps|Founder timeline|Regularity|Most annoying|Riskiest|Growth-focused/ }))
  // Scope to the LISTBOX — the mobile fallback <select>'s options share the role in jsdom.
  const listbox = scope.getByRole('listbox', { name: 'Rank by' })
  fireEvent.click(within(listbox).getByRole('option', { name: new RegExp(label) }))
}

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
    pickPreset({ getByRole }, 'Riskiest')
    expect(params().get('order')).toBe('risk')
    pickPreset({ getByRole }, 'Founder timeline')
    expect(params().get('order')).toBe('timeline') // human-readable alias, not order=order
    pickPreset({ getByRole }, 'Most automatable') // the default sort — param gone
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
    pickPreset({ getByRole }, 'Growth-focused')
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
    pickPreset({ getByRole }, 'Riskiest')
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

describe('chain rows in the combined table (founder 2026-09-29: one view under the search; the same-day follow-up drops the "playbook" vocabulary — chain rows fold into their dominant area)', () => {
  function playbook(over: Pick<PlaybookRow, 'id' | 'title'> & Partial<PlaybookRow>): PlaybookRow {
    return {
      tagline: 'From zero to a running company',
      icon: '🚀',
      href: `/processes/chains/${over.id}`,
      // Dominant area = the FIRST constituent's area; timeOrder = that constituent's timeOrder.
      // Set to 'Starting up' at timeOrder 1 so the grouped test proves the fold: the chain ties
      // with Incorporate (timeOrder 1) and the plain process leads on a tie.
      dominantArea: 'Starting up',
      areaRank: 0,
      timeOrder: 1,
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

  it('grouped default: the chain row folds into its dominant area at its first-constituent timeOrder — no leading Playbooks group, no playbook label', () => {
    const { container } = mountWith()
    const texts = rowTexts(container)
    const at = (probe: string) => texts.findIndex((t) => t.includes(probe))
    // No 'Playbooks' group header and no 'playbook' chip anywhere — one vocabulary.
    expect(within(container).queryByText('Playbooks')).toBeNull()
    expect(within(container).queryByText('playbook')).toBeNull()
    // Inside 'Starting up' (its dominant area): Incorporate (timeOrder 1, plain process leads
    // the tie) → Company in a day (timeOrder 1) → Open a bank account (timeOrder 2).
    expect(at('Starting up')).toBeLessThan(at('Company in a day'))
    expect(at('Incorporate the company')).toBeLessThan(at('Company in a day'))
    expect(at('Company in a day')).toBeLessThan(at('Open a bank account'))
    expect(at('Company in a day')).toBeLessThan(at('Growth & sales')) // inside the area, not after it
    // The area header counts the chain row as a process (playbooks are still processes).
    const header = within(container).getByText('Starting up').closest('tr') as HTMLElement
    expect(header.textContent).toContain('3 processes')
  })

  it('a chain row keeps its composition signals and links to its chain page: constituent chips, honest metric dash — no category chip', () => {
    const { container } = mountWith()
    const tr = within(container).getByText('Company in a day').closest('tr') as HTMLElement
    expect(within(tr).queryByText('playbook')).toBeNull() // the chip is gone (founder 2026-09-29)
    expect(within(tr).getByText('Company in a day').closest('a')?.getAttribute('href')).toBe('/processes/chains/company-in-a-day')
    expect(tr.textContent).toContain('7/10') // aggregate agent/total steps
    // Route-dot strip removed (founder 2026-09-29) — no per-step dots render.
    expect(within(tr).queryByTitle('File the charter — agent-runnable')).toBeNull()
    // No timeline/cadence/risk value to show — the metric cell is an honest dash.
    expect(within(tr).getByText('—')).toBeDefined()
    // Process rows are unchanged next to it (their own links intact).
    expect(within(container).getByText('Run payroll').closest('a')?.getAttribute('href')).toBe('/processes/run-payroll')
  })

  it('a ceiling sort interleaves chain rows by their aggregate ceiling (flat semantics unchanged)', () => {
    const { container, getByRole } = mountWith()
    pickPreset({ getByRole }, 'Most automatable')
    const texts = rowTexts(container)
    const at = (probe: string) => texts.findIndex((t) => t.includes(probe))
    // pct desc: Run payroll 90 → chain 70 → Incorporate 60 → bank 40.
    expect(at('Run payroll')).toBeLessThan(at('Company in a day'))
    expect(at('Company in a day')).toBeLessThan(at('Incorporate the company'))
    expect(within(container).queryByText('Starting up')).toBeNull() // flat — no group headers
  })

  it('a per-process ordering (risk) lists chain rows after the sorted processes — missing values last', () => {
    const { container, getByRole } = mountWith()
    pickPreset({ getByRole }, 'Riskiest')
    const texts = rowTexts(container)
    expect(texts.findIndex((t) => t.includes('Company in a day'))).toBe(texts.length - 1)
  })

  it('the phase filter scopes chain rows by their constituent processes; the text filter matches name and taglines', () => {
    const { container } = mountWith()
    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'Growth' } })
    expect(within(container).queryByText('Company in a day')).toBeNull() // Formation-only chain filtered out
    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'Formation' } })
    expect(within(container).getByText('Company in a day')).toBeDefined()

    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'all' } })
    const search = within(container).getByLabelText('Filter products by name or vendor')
    fireEvent.change(search, { target: { value: 'zero to a running' } }) // the tagline
    expect(within(container).getByText('Company in a day')).toBeDefined()
    expect(within(container).queryByText('Run payroll')).toBeNull()
    fireEvent.change(search, { target: { value: 'zzz-no-match' } })
    // One vocabulary in the empty state too — chain rows are processes.
    expect(container.textContent).toContain('No processes match')
    expect(container.textContent).not.toContain('playbooks')
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
