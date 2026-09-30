// @vitest-environment jsdom
// The combined /processes view (founder 2026-09-29: "combine playbooks and all processes into
// one table so we have one view for the processes under the process search"), with the same-day
// vocabulary follow-up ("we don't need to say 'playbook' on those playbooks… playbooks are
// still processes"): chain rows fold into their dominant area — no 'Playbooks' group, no chip,
// heading 'All processes', one unified search count. The VS card stays; the legend is gone.
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProcessesPage from '@/app/processes/page'
import { areaOf, buildPlaybookRows, buildProcessRows } from '@/lib/processRows'

describe('/processes — one combined table, one processes vocabulary', () => {
  it("renders ONE table under the 'All processes' heading; chain rows fold into their dominant area (no 'Playbooks' group or label)", () => {
    const { container } = render(<ProcessesPage />)

    // Exactly one table on the page (the old page rendered a second, playbooks-only table).
    expect(container.querySelectorAll('table').length).toBe(1)
    expect(within(container).queryByText('End-to-end playbooks')).toBeNull()
    expect(within(container).queryByText('Playbooks & all processes')).toBeNull()
    expect(within(container).getByText('All processes')).toBeDefined()

    const table = container.querySelector('table') as HTMLElement
    const playbooks = buildPlaybookRows()
    const { rows } = buildProcessRows()
    // No leading 'Playbooks' group header and no 'playbook' chip — one vocabulary.
    expect(within(table).queryByText('Playbooks')).toBeNull()
    expect(within(table).queryByText('playbook')).toBeNull()
    expect(table.querySelectorAll('tbody tr').length).toBeGreaterThanOrEqual(playbooks.length + rows.length)
    // Each chain row links to its chain page from inside the one table, folded into its
    // dominant area (its group header precedes the row).
    const trs = [...table.querySelectorAll('tbody tr')]
    for (const p of playbooks) {
      expect(table.querySelector(`a[href="${p.href}"]`), `chain ${p.id} must link to its chain page`).not.toBeNull()
      const rowIdx = trs.findIndex((tr) => tr.querySelector(`a[href="${p.href}"]`) !== null)
      const headerIdx = trs.findIndex((tr) => tr.querySelector('th') !== null && tr.textContent?.includes(p.dominantArea))
      expect(headerIdx, `chain ${p.id} must sit under its dominant area "${p.dominantArea}"`).toBeGreaterThanOrEqual(0)
      expect(headerIdx).toBeLessThan(rowIdx)
    }
    // A process row is unchanged next to them.
    expect(table.querySelector(`a[href="/processes/${rows[0].slug}"]`)).not.toBeNull()
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
