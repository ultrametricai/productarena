// @vitest-environment jsdom
// The combined /processes view (founder 2026-09-29: "combine playbooks and all processes into
// one table so we have one view for the processes under the process search"): the separate
// playbooks section is gone — playbooks are rows in the same table, and the fat search matches
// them too. The VS card and the route-dot legend stay.
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProcessesPage from '@/app/processes/page'
import { buildPlaybookRows, buildProcessRows } from '@/lib/processRows'

describe('/processes — one combined playbooks + processes table', () => {
  it('renders ONE table: playbooks lead as a group, every process follows; the old separate section is gone', () => {
    const { container } = render(<ProcessesPage />)

    // Exactly one table on the page (the old page rendered a second, playbooks-only table).
    expect(container.querySelectorAll('table').length).toBe(1)
    expect(within(container).queryByText('End-to-end playbooks')).toBeNull()
    expect(within(container).getByText('Playbooks & all processes')).toBeDefined()

    const table = container.querySelector('table') as HTMLElement
    const playbooks = buildPlaybookRows()
    const { rows } = buildProcessRows()
    // The leading Playbooks group header, then every playbook + every process as rows.
    expect(within(table).getByText('Playbooks')).toBeDefined()
    expect(table.querySelectorAll('tbody tr').length).toBeGreaterThanOrEqual(playbooks.length + rows.length)
    // Each playbook row links to its chain page from inside the one table.
    for (const p of playbooks) {
      expect(table.querySelector(`a[href="${p.href}"]`), `playbook ${p.id} must link to its chain page`).not.toBeNull()
    }
    // A process row is unchanged next to them.
    expect(table.querySelector(`a[href="/processes/${rows[0].slug}"]`)).not.toBeNull()
  })

  it('the fat search covers both kinds and the legend + Virtual Startup card stay', () => {
    const { container } = render(<ProcessesPage />)
    const playbooks = buildPlaybookRows()
    const { rows } = buildProcessRows()

    const input = within(container).getByLabelText('Search processes') as HTMLInputElement
    expect(input.placeholder).toContain(`${rows.length} company processes`)
    expect(input.placeholder).toContain(`${playbooks.length} playbook`)

    // The route-dot legend (explains the playbook rows' strips) and the VS card survive.
    expect(within(container).getByText('agent-runnable')).toBeDefined()
    expect(within(container).getByText('legal signature')).toBeDefined()
    expect(within(container).getByText('🐣 Virtual Startup').closest('a')?.getAttribute('href')).toBe('/virtual-startup')
  })
})
