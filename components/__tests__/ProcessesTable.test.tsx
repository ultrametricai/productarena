// @vitest-environment jsdom
// ProcessesTable's shareable-view URL params (founder 2026-09-21, lib/urlState.ts):
//   ?order=<preset>  the sort/ordering ('timeline' spells the timeOrder column; 'grouped' the
//                    grouped-by-area view; the founder-timeline default elided)
//   ?phase=<phase>   phase filter ('all' elided)
//   ?pq=<text>       text filter (pq, NOT q — must coexist with MegaTable's ?q on the homepage)
// Contract per param: (a) present on mount → the view applies after hydration, (b) changing the
// control writes it, (c) the default state removes it; invalid values fall back silently.
// Since 2026-09-30 the no-param default is the flat FOUNDER-TIMELINE sort — the rank-by
// dropdown visibly shows 'Founder timeline' — and the grouped-by-area view (the 2026-09-28
// default) is the dropdown's TOP entry, shareable as ?order=grouped.
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
    area: 'Formation',
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

// Two areas; 'Formation' (the merged startup+formation area — founder 2026-09-30) holds two
// rows deliberately OUT of timeOrder in the array (bank timeOrder 2 before incorporate
// timeOrder 1) so both the default timeline sort and the grouped view's within-area ordering
// are proven, not inherited. 'Growth & sales' (rank 8) comes after 'Formation' (rank 0).
// Phases are corpus-style lowercase so the capitalized AREA probes never match a phase cell.
const ROWS: ProcessRow[] = [
  row({ slug: 'open-bank-account', title: 'Open a bank account', phase: 'formation', risk: 5, timeOrder: 2, pct: 40 }),
  row({ slug: 'run-payroll', title: 'Run payroll', phase: 'growth', area: 'Growth & sales', areaRank: 8, risk: 2, timeOrder: 5, pct: 90 }),
  row({ slug: 'incorporate', title: 'Incorporate the company', phase: 'formation', risk: 4, timeOrder: 1, pct: 60 }),
]
const PHASES = ['formation', 'growth']

// The visual order of the table: area headers and row titles as they appear top-to-bottom.
const bodyOrder = (root: HTMLElement) =>
  [...root.querySelectorAll('tbody tr')].map((tr) => {
    for (const probe of ['Formation', 'Growth & sales', 'Open a bank account', 'Run payroll', 'Incorporate the company']) {
      if (tr.textContent?.includes(probe)) return probe
    }
    return '?'
  })

const mount = () => render(<ProcessesTable rows={ROWS} phases={PHASES} />)

const thFor = (root: HTMLElement, label: string) =>
  within(root).getAllByText(label).map((el) => el.closest('th')).find((th) => th !== null) ?? null

beforeEach(() => setUrl(''))


// The rank-by presets live in ONE dropdown (founder 2026-09-30) — open it, pick the option.
const pickPreset = (scope: { getByRole: (role: string, opts?: object) => HTMLElement }, label: string) => {
  fireEvent.click(scope.getByRole('button', { name: /Rank by|Grouped by area|Most automatable|Most steps|Founder timeline|Regularity|Most annoying|Riskiest|Growth-focused/ }))
  // Scope to the LISTBOX — the mobile fallback <select>'s options share the role in jsdom.
  const listbox = scope.getByRole('listbox', { name: 'Rank by' })
  fireEvent.click(within(listbox).getByRole('option', { name: new RegExp(label) }))
}

describe('mount applies URL params (invalids fall back silently)', () => {
  it("pristine URL renders the default view: flat founder-timeline sort, the dropdown showing 'Founder timeline'", () => {
    const { container, getByRole } = mount()
    // Flat — no area group headers.
    expect(within(container).queryByText('Formation')).toBeNull()
    expect(thFor(container, 'Timeline')?.getAttribute('aria-sort')).toBe('ascending')
    // Rows in timeOrder: incorporate (1) → bank (2) → payroll (5), despite the array order.
    expect(bodyOrder(container)).toEqual(['Incorporate the company', 'Open a bank account', 'Run payroll'])
    // The rank-by control visibly shows the default selection (founder 2026-09-30).
    expect(getByRole('button', { name: /Founder timeline/ })).toBeDefined()
    expect((within(container).getByLabelText('Filter by phase') as HTMLSelectElement).value).toBe('all')
  })

  it('?order=risk sorts by risk in its preset direction (desc)', () => {
    setUrl('?order=risk')
    const { container } = mount()
    expect(thFor(container, 'Risk')?.getAttribute('aria-sort')).toBe('descending')
    const titles = within(container).getAllByText(/Open a bank account|Run payroll/).map((el) => el.textContent)
    expect(titles.indexOf('Open a bank account')).toBeLessThan(titles.indexOf('Run payroll')) // risk 5 first
  })

  it("?order=timeline (the default, elided on write) is still accepted on read", () => {
    setUrl('?order=timeline')
    const { container } = mount()
    expect(thFor(container, 'Timeline')?.getAttribute('aria-sort')).toBe('ascending')
  })

  it('?order=grouped opens the grouped-by-area view (the former default), no column sorted', () => {
    setUrl('?order=grouped')
    const { container } = mount()
    expect(within(container).getByText('Formation')).toBeDefined() // area headers render
    expect(thFor(container, 'Agent ceiling')?.getAttribute('aria-sort')).toBe('none')
    expect(thFor(container, 'Cadence')?.getAttribute('aria-sort')).toBe('none')
  })

  it('?phase= and ?pq= apply the phase filter and search box', () => {
    setUrl('?phase=growth&pq=payroll')
    const { container } = mount()
    expect((within(container).getByLabelText('Filter by phase') as HTMLSelectElement).value).toBe('growth')
    expect((within(container).getByLabelText('Filter products by name or vendor') as HTMLInputElement).value).toBe('payroll')
    expect(within(container).queryByText('Open a bank account')).toBeNull()
    expect(within(container).getByText('Run payroll')).toBeDefined()
  })

  it('invalid ?order/?phase fall back to the defaults (the flat timeline view), silently', () => {
    setUrl('?order=vibes&phase=Retirement')
    const { container } = mount()
    expect(within(container).queryByText('Formation')).toBeNull() // flat — no area headers
    expect(thFor(container, 'Timeline')?.getAttribute('aria-sort')).toBe('ascending')
    expect((within(container).getByLabelText('Filter by phase') as HTMLSelectElement).value).toBe('all')
  })

  it('?order=pct opens the flat ceiling-sorted view', () => {
    setUrl('?order=pct')
    const { container } = mount()
    expect(within(container).queryByText('Formation')).toBeNull() // flat, no area headers
    expect(thFor(container, 'Agent ceiling')?.getAttribute('aria-sort')).toBe('descending')
  })
})

describe('interactions write params; defaults remove them', () => {
  it('an ordering preset writes ?order=, and the default (Founder timeline) removes it', () => {
    const { getByRole } = mount()
    pickPreset({ getByRole }, 'Riskiest')
    expect(params().get('order')).toBe('risk')
    pickPreset({ getByRole }, 'Most automatable')
    expect(params().get('order')).toBe('pct') // no longer the default — written since 2026-09-30
    pickPreset({ getByRole }, 'Founder timeline') // the default sort — param gone
    expect(params().get('order')).toBeNull()
  })

  it('the phase <select> and the in-row phase button write ?phase=; All/again clears it', () => {
    const { container } = mount()
    const select = within(container).getByLabelText('Filter by phase')
    fireEvent.change(select, { target: { value: 'formation' } })
    expect(params().get('phase')).toBe('formation')
    fireEvent.change(select, { target: { value: 'all' } })
    expect(params().get('phase')).toBeNull()

    const phaseButton = within(container).getByTitle(/click to filter to growth/)
    fireEvent.click(phaseButton)
    expect(params().get('phase')).toBe('growth')
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

describe("grouped-by-area view (founder 2026-09-28; the dropdown's top entry since 2026-09-30)", () => {
  it("picking 'Grouped by area' renders area headers in lifecycle order with counts, rows in timeOrder within each area, and writes ?order=grouped", () => {
    const { container, getByRole } = mount()
    pickPreset({ getByRole }, 'Grouped by area')
    expect(params().get('order')).toBe('grouped')
    // Areas in AREA_ORDER (areaRank), rows re-sorted by timeOrder inside 'Formation'
    // (incorporate timeOrder 1 before bank timeOrder 2, despite the array order).
    expect(bodyOrder(container)).toEqual([
      'Formation', 'Incorporate the company', 'Open a bank account',
      'Growth & sales', 'Run payroll',
    ])
    // Header stats: count only (avg ceiling dropped — founder 2026-09-29).
    const formation = within(container).getByText('Formation').closest('tr') as HTMLElement
    expect(formation.textContent).toContain('2 processes')
    expect(formation.textContent).not.toContain('%')
    const growth = within(container).getByText('Growth & sales').closest('tr') as HTMLElement
    expect(growth.textContent).toContain('1 process')
  })

  it('a rank-by preset flattens the grouped view; the timeline default clears ?order=', () => {
    setUrl('?order=grouped')
    const { container, getByRole } = mount()
    expect(within(container).getByText('Formation')).toBeDefined()
    pickPreset({ getByRole }, 'Riskiest')
    expect(within(container).queryByText('Formation')).toBeNull() // flat — headers gone
    expect(thFor(container, 'Risk')?.getAttribute('aria-sort')).toBe('descending')
    expect(params().get('order')).toBe('risk')

    pickPreset({ getByRole }, 'Grouped by area')
    expect(within(container).getByText('Formation')).toBeDefined() // grouped again
    expect(params().get('order')).toBe('grouped')
    pickPreset({ getByRole }, 'Founder timeline')
    expect(params().get('order')).toBeNull() // back to the no-param default
  })

  it('a column-header sort also flattens (grouping and cross-corpus sorting cannot coexist)', () => {
    setUrl('?order=grouped')
    const { container } = mount()
    const processTh = thFor(container, 'Process') as HTMLElement
    fireEvent.click(within(processTh).getByRole('button'))
    expect(within(container).queryByText('Formation')).toBeNull()
    expect(processTh.getAttribute('aria-sort')).toBe('ascending') // title's preset direction
    expect(params().get('order')).toBe('title')
  })

  it('the phase filter collapses the grouped view to the matching area(s)', () => {
    setUrl('?order=grouped')
    const { container } = mount()
    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'formation' } })
    expect(within(container).getByText('Formation')).toBeDefined()
    expect(within(container).queryByText('Growth & sales')).toBeNull()
    expect(within(container).queryByText('Run payroll')).toBeNull()
    expect(params().get('phase')).toBe('formation') // URL contract untouched in the grouped view
  })
})

describe('chain rows in the combined table (founder 2026-09-29: one view under the search; the same-day follow-up drops the "playbook" vocabulary — chain rows fold into their dominant area)', () => {
  function playbook(over: Pick<PlaybookRow, 'id' | 'title'> & Partial<PlaybookRow>): PlaybookRow {
    return {
      tagline: 'From zero to a running company',
      icon: '🚀',
      href: `/processes/chains/${over.id}`,
      // Dominant area = the FIRST constituent's area; timeOrder = that constituent's timeOrder.
      // Set to 'Formation' at timeOrder 1 so the grouped test proves the fold: the chain ties
      // with Incorporate (timeOrder 1) and the plain process leads on a tie.
      dominantArea: 'Formation',
      areaRank: 0,
      timeOrder: 1,
      // Titles deliberately distinct from ROWS' (IconChip renders its title as sr-only text —
      // colliding names would make textContent probes ambiguous).
      processes: [
        { id: 'pick-a-name', icon: '🏷️', title: 'Pick a company name', phase: 'formation' },
        { id: 'file-delaware', icon: '🏛', title: 'File with Delaware', phase: 'formation' },
      ],
      phases: ['formation'],
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

  it('grouped view: the chain row folds into its dominant area at its first-constituent timeOrder — no leading Playbooks group, no playbook label', () => {
    setUrl('?order=grouped')
    const { container } = mountWith()
    const texts = rowTexts(container)
    const at = (probe: string) => texts.findIndex((t) => t.includes(probe))
    // No 'Playbooks' group header and no 'playbook' chip anywhere — one vocabulary.
    expect(within(container).queryByText('Playbooks')).toBeNull()
    expect(within(container).queryByText('playbook')).toBeNull()
    // Inside 'Formation' (its dominant area): Incorporate (timeOrder 1, plain process leads
    // the tie) → Company in a day (timeOrder 1) → Open a bank account (timeOrder 2).
    expect(at('Formation')).toBeLessThan(at('Company in a day'))
    expect(at('Incorporate the company')).toBeLessThan(at('Company in a day'))
    expect(at('Company in a day')).toBeLessThan(at('Open a bank account'))
    expect(at('Company in a day')).toBeLessThan(at('Growth & sales')) // inside the area, not after it
    // The area header counts the chain row as a process (playbooks are still processes).
    const header = within(container).getByText('Formation').closest('tr') as HTMLElement
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
    expect(within(container).queryByText('Formation')).toBeNull() // flat — no group headers
  })

  it('a per-process ordering (risk) lists chain rows after the sorted processes — missing values last', () => {
    const { container, getByRole } = mountWith()
    pickPreset({ getByRole }, 'Riskiest')
    const texts = rowTexts(container)
    expect(texts.findIndex((t) => t.includes('Company in a day'))).toBe(texts.length - 1)
  })

  it('the default founder-timeline view also lists chain rows after the sorted processes (no timeOrder of their own in the flat view)', () => {
    const { container } = mountWith()
    const texts = rowTexts(container)
    expect(texts.findIndex((t) => t.includes('Company in a day'))).toBe(texts.length - 1)
  })

  it('the phase filter scopes chain rows by their constituent processes; the text filter matches name and taglines', () => {
    const { container } = mountWith()
    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'growth' } })
    expect(within(container).queryByText('Company in a day')).toBeNull() // formation-only chain filtered out
    fireEvent.change(within(container).getByLabelText('Filter by phase'), { target: { value: 'formation' } })
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

describe('geoScope glyphs (founder GEO ask 2026-09-28; always-on defaults founder 2026-09-30)', () => {
  // The module-level geo store outlives unmounts — always reset.
  afterEach(() => setGeoSelection(null))
  const GEO_ROWS: ProcessRow[] = [
    row({ slug: 'open-bank-account', title: 'Open a bank account', phase: 'formation', geoScope: 'global' }),
    row({ slug: 'incorporate', title: 'Incorporate the company', phase: 'formation', geoScope: 'us-state', timeOrder: 2 }),
    row({ slug: 'get-an-ein', title: 'Get an EIN', phase: 'formation', geoScope: 'us', timeOrder: 3 }),
  ]
  const cellFor = (root: HTMLElement, title: string) =>
    [...root.querySelectorAll('tbody td:first-child')].find((c) => c.textContent?.includes(title))

  it('no selection: every row still wears its DEFAULT glyph — 🇺🇸 for us AND us-state, 🌐 for global (no 🏛)', () => {
    const { container } = render(<ProcessesTable rows={GEO_ROWS} phases={PHASES} />)
    expect(cellFor(container, 'Open a bank account')?.textContent).toContain('🌐')
    expect(cellFor(container, 'Incorporate the company')?.textContent).toContain('🇺🇸')
    expect(cellFor(container, 'Get an EIN')?.textContent).toContain('🇺🇸')
    // The sharper state glyph waits for a selection (the title CELL — the phase column's own
    // 🏛️ phase icon is a different, unrelated glyph).
    expect(cellFor(container, 'Incorporate the company')?.textContent).not.toContain('🏛')
  })

  it('a non-US selection sharpens each row to its scope glyph (🌐 / 🇺🇸 / 🏛) without re-sorting', () => {
    const { container } = render(<ProcessesTable rows={GEO_ROWS} phases={PHASES} />)
    act(() => setGeoSelection('UK'))
    const cells = [...container.querySelectorAll('tbody td:first-child')]
    const byTitle = (t: string) => cells.find((c) => c.textContent?.includes(t))
    expect(byTitle('Open a bank account')?.textContent).toContain('🌐')
    expect(byTitle('Incorporate the company')?.textContent).toContain('🏛')
    expect(byTitle('Get an EIN')?.textContent).toContain('🇺🇸')
    // Annotation only — the timeOrder sort is exactly the no-selection order.
    expect(cells.map((c) => c.textContent?.includes('Open a bank account') ? 'bank' : c.textContent?.includes('Incorporate') ? 'inc' : 'ein')).toEqual(['bank', 'inc', 'ein'])
    act(() => setGeoSelection(null))
    // Back to the default glyphs — us-state returns to the 🇺🇸 default.
    expect(cellFor(container, 'Incorporate the company')?.textContent).toContain('🇺🇸')
    expect(cellFor(container, 'Incorporate the company')?.textContent).not.toContain('🏛')
  })
})
