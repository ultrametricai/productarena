// @vitest-environment jsdom
// The /situations index (founder 2026-10-02): the 12 reactive records moved OUT of the
// /processes table onto their own page — trigger subtitle, urgency chip, geo glyph, sorted by
// urgency (hours → days → weeks) then title, every row linking to its detail page which STAYS
// at /processes/<slug> this round (URL stability).
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SituationsPage from '@/app/situations/page'
import { buildSituationRows } from '@/lib/processRows'
import { GEO_SCOPE_GLYPH } from '@/lib/geoPreference'
import { loadProcesses, processSlug } from '@/lib/processes'
import { URGENCY_META, URGENCY_TIERS } from '@/lib/processSim'

describe('/situations', () => {
  const situations = loadProcesses().filter((t) => t.kind === 'situation')

  it('renders ALL 12 situations as rows linking to their /processes/<slug> detail pages', () => {
    const { container } = render(<SituationsPage />)
    expect(situations).toHaveLength(12)
    const table = container.querySelector('table') as HTMLElement
    expect(table.querySelectorAll('tbody tr')).toHaveLength(12)
    for (const t of situations) {
      expect(
        table.querySelector(`a[href="/processes/${processSlug(t.title)}"]`),
        `${t.id} must link its detail page`,
      ).not.toBeNull()
    }
  })

  it('rows are sorted by urgency (hours → days → weeks), then title, with the urgency chip and trigger subtitle on every row', () => {
    const { container } = render(<SituationsPage />)
    const rows = buildSituationRows()
    const table = container.querySelector('table') as HTMLElement
    const trs = [...table.querySelectorAll('tbody tr')]
    // DOM order IS the buildSituationRows order (urgency rank, then title).
    rows.forEach((r, i) => {
      expect(trs[i].querySelector(`a[href="/processes/${r.slug}"]`), `${r.slug} at index ${i}`).not.toBeNull()
      expect(trs[i].textContent).toContain(r.trigger!)
      expect(trs[i].textContent).toContain(URGENCY_META[r.urgency!].label)
    })
    const tiers = rows.map((r) => URGENCY_TIERS.indexOf(r.urgency!))
    expect([...tiers].sort((a, b) => a - b)).toEqual(tiers)
    expect(tiers[0]).toBe(URGENCY_TIERS.indexOf('hours'))
  })

  it('every row wears its sharp geo-scope glyph (🌐 / 🇺🇸 / 🏛) from the server render', () => {
    const { container } = render(<SituationsPage />)
    const table = container.querySelector('table') as HTMLElement
    const countByTitle = (label: string) => table.querySelectorAll(`span[title="${label}"]`).length
    for (const scope of ['global', 'us', 'us-state'] as const) {
      const expected = situations.filter((t) => t.geoScope === scope).length
      expect(countByTitle(GEO_SCOPE_GLYPH[scope].label), `${scope} rows glyph-marked`).toBe(expected)
    }
  })

  it('reads as its own area: a Situations h1 with NO intro paragraph (founder 2026-10-02)', () => {
    const { container } = render(<SituationsPage />)
    expect(within(container).getByRole('heading', { level: 1 }).textContent).toContain('Situations')
    // The 'Not stops on the founder journey …' paragraph is gone — the heading stands alone.
    expect(container.textContent).not.toContain('Not stops on the founder journey')
  })

  it('table columns: Area (not Phase — the cell is the domain tag) and no Steps column (founder 2026-10-02)', () => {
    const { container } = render(<SituationsPage />)
    const headers = [...container.querySelectorAll('thead th')].map((th) => th.textContent)
    expect(headers).toEqual(['Situation', 'Urgency', 'Area', 'Agentic %'])
    // The per-row 'N/M' steps link left with its column.
    expect(container.querySelector('a[href$="#steps"]')).toBeNull()
  })
})
