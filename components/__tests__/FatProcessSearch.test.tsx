// @vitest-environment jsdom
// The /processes hero search (founder 2026-09-25), extended by the combined-table ask (founder
// 2026-09-29): the pre-serialized rows now include the end-to-end playbooks — same substring
// matching, a 'playbook' chip on the result, href pointing at the chain page.
import { fireEvent, render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FatProcessSearch, { type FatSearchRow } from '@/components/FatProcessSearch'

const ROWS: FatSearchRow[] = [
  { href: '/processes/run-payroll', title: 'Run payroll', icon: '💸', phase: 'hr', pct: 80 },
  { href: '/processes/incorporate', title: 'Incorporate the company', icon: '🏛', phase: 'formation', pct: 60 },
  { href: '/processes/chains/company-in-a-day', title: 'Company in a day', icon: '🚀', phase: 'playbook', pct: 70, playbook: true },
]

function type(input: HTMLElement, value: string) {
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value } })
}

describe('FatProcessSearch over processes AND playbooks', () => {
  it('the placeholder counts the two row kinds separately', () => {
    const { getByLabelText } = render(<FatProcessSearch rows={ROWS} />)
    expect((getByLabelText('Search processes') as HTMLInputElement).placeholder)
      .toBe('Search 2 company processes & 1 playbook — payroll, SOC 2, EIN…')
  })

  it('a process-only rows prop keeps the original placeholder (homepage-style callers unchanged)', () => {
    const { getByLabelText } = render(<FatProcessSearch rows={ROWS.filter((r) => !r.playbook)} />)
    expect((getByLabelText('Search processes') as HTMLInputElement).placeholder)
      .toBe('Search 2 company processes — payroll, SOC 2, EIN…')
  })

  it('matches a playbook by title and links the result to its chain page, wearing the playbook chip', () => {
    const { getByLabelText, container } = render(<FatProcessSearch rows={ROWS} />)
    type(getByLabelText('Search processes'), 'company in a')
    const link = within(container as HTMLElement).getByText('Company in a day').closest('a') as HTMLElement
    expect(link.getAttribute('href')).toBe('/processes/chains/company-in-a-day')
    expect(within(link).getByText('playbook')).toBeDefined()
    expect(link.textContent).toContain('70%') // the aggregate ceiling rides along
  })

  it("matches playbooks on the literal 'playbook' pseudo-phase; process results carry no chip", () => {
    const { getByLabelText, container } = render(<FatProcessSearch rows={ROWS} />)
    type(getByLabelText('Search processes'), 'playbook')
    expect(within(container as HTMLElement).getByText('Company in a day')).toBeDefined()

    type(getByLabelText('Search processes'), 'payroll')
    const link = within(container as HTMLElement).getByText('Run payroll').closest('a') as HTMLElement
    expect(link.getAttribute('href')).toBe('/processes/run-payroll')
    expect(within(link).queryByText('playbook')).toBeNull()
  })
})
