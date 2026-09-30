// @vitest-environment jsdom
// The combined /processes view (founder 2026-09-29: "combine playbooks and all processes into
// one table so we have one view for the processes under the process search"), with the same-day
// vocabulary follow-up ("we don't need to say 'playbook' on those playbooks… playbooks are
// still processes"): chain rows in the one table — no 'Playbooks' group, no chip, one unified
// search count, the VS card stays. Founder 2026-09-30: the 'All processes' heading is gone (the
// table stands alone under the search) and the default view is the flat FOUNDER-TIMELINE sort —
// process rows in timeOrder, chain rows (no timeOrder of their own in the flat view) after them.
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProcessesPage from '@/app/processes/page'
import { areaOf, buildPlaybookRows, buildProcessRows } from '@/lib/processRows'

describe('/processes — one combined table, one processes vocabulary', () => {
  it("renders ONE table with no 'All processes' heading, flat in founder-timeline order, chain rows linked after the processes (no 'Playbooks' group or label)", () => {
    const { container } = render(<ProcessesPage />)

    // Exactly one table on the page (the old page rendered a second, playbooks-only table).
    expect(container.querySelectorAll('table').length).toBe(1)
    expect(within(container).queryByText('End-to-end playbooks')).toBeNull()
    expect(within(container).queryByText('Playbooks & all processes')).toBeNull()
    // The heading is gone (founder 2026-09-30) — the table stands alone under the search.
    expect(within(container).queryByText('All processes')).toBeNull()

    const table = container.querySelector('table') as HTMLElement
    const playbooks = buildPlaybookRows()
    const { rows } = buildProcessRows()
    // No leading 'Playbooks' group header and no 'playbook' chip — one vocabulary.
    expect(within(table).queryByText('Playbooks')).toBeNull()
    expect(within(table).queryByText('playbook')).toBeNull()
    // The default view is FLAT founder-timeline (founder 2026-09-30) — no area group headers.
    expect(table.querySelectorAll('tbody th').length).toBe(0)
    expect(table.querySelectorAll('tbody tr').length).toBe(playbooks.length + rows.length)
    // Process rows lead in timeOrder; chain rows (no per-process timeOrder in the flat view)
    // follow them, each linking to its chain page from inside the one table.
    const trs = [...table.querySelectorAll('tbody tr')]
    const lastProcessIdx = Math.max(
      ...rows.map((r) => trs.findIndex((tr) => tr.querySelector(`a[href="/processes/${r.slug}"]`) !== null)),
    )
    for (const p of playbooks) {
      const rowIdx = trs.findIndex((tr) => tr.querySelector(`a[href="${p.href}"]`) !== null)
      expect(rowIdx, `chain ${p.id} must link to its chain page`).toBeGreaterThanOrEqual(0)
      expect(rowIdx, `chain ${p.id} must follow the timeline-sorted processes`).toBeGreaterThan(lastProcessIdx)
    }
    // The first two process rows really are in founder-timeline order.
    const byTime = [...rows].sort((a, b) => a.timeOrder - b.timeOrder)
    const idxOf = (slug: string) => trs.findIndex((tr) => tr.querySelector(`a[href="/processes/${slug}"]`) !== null)
    expect(idxOf(byTime[0].slug)).toBeLessThan(idxOf(byTime[byTime.length - 1].slug))
    expect(idxOf(byTime[0].slug)).toBe(0)
  })

  it('every chain row carries its dominant area (first constituent) and that constituent timeOrder', () => {
    for (const p of buildPlaybookRows()) {
      expect(p.dominantArea).toBe(areaOf(p.processes[0].phase))
      expect(p.timeOrder).toBeGreaterThanOrEqual(1)
    }
  })

  it('the fat search counts chains in the one processes N; the simulator card stays (renamed 2026-09-30, item 1)', () => {
    const { container } = render(<ProcessesPage />)
    const playbooks = buildPlaybookRows()
    const { rows } = buildProcessRows()

    const input = within(container).getByLabelText('Search processes') as HTMLInputElement
    expect(input.placeholder).toBe(`Search ${rows.length + playbooks.length} processes — payroll, SOC 2, EIN…`)

    // The route-dot legend was removed with the dots (founder 2026-09-29).
    expect(within(container).queryByText('agent-runnable')).toBeNull()
    // 'Virtual Startup' → 'The open startup simulator' (founder batch 2026-09-30, item 1) —
    // the route and internal vocabulary stay /virtual-startup.
    expect(within(container).getByText('🐣 The open startup simulator').closest('a')?.getAttribute('href')).toBe('/virtual-startup')
  })
})
