// @vitest-environment jsdom
// The /processes hero search (founder 2026-09-25), extended by the combined-table ask (founder
// 2026-09-29): the pre-serialized rows now include the end-to-end chains — same substring
// matching, href pointing at the chain page. Same-day follow-up ("we don't need to say
// 'playbook'… playbooks are still processes"): no chip, one unified count, 'multi-process' hover.
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

describe('FatProcessSearch over processes AND chains (one vocabulary — founder 2026-09-29)', () => {
  it('the placeholder is one unified count with chains counted in N', () => {
    const { getByLabelText } = render(<FatProcessSearch rows={ROWS} />)
    expect((getByLabelText('Search processes') as HTMLInputElement).placeholder)
      .toBe('Search 3 processes — payroll, SOC 2, EIN…')
  })

  it('a process-only rows prop uses the same unified copy (homepage-style callers)', () => {
    const { getByLabelText } = render(<FatProcessSearch rows={ROWS.filter((r) => !r.playbook)} />)
    expect((getByLabelText('Search processes') as HTMLInputElement).placeholder)
      .toBe('Search 2 processes — payroll, SOC 2, EIN…')
  })

  it("matches a chain by title and links to its chain page — no 'playbook' chip, hover says multi-process", () => {
    const { getByLabelText, container } = render(<FatProcessSearch rows={ROWS} />)
    type(getByLabelText('Search processes'), 'company in a')
    const link = within(container as HTMLElement).getByText('Company in a day').closest('a') as HTMLElement
    expect(link.getAttribute('href')).toBe('/processes/chains/company-in-a-day')
    expect(within(link).queryByText('playbook')).toBeNull() // the chip is gone
    expect(within(link).getByTitle('Company in a day — multi-process')).toBeDefined()
    expect(link.textContent).toContain('70%') // the aggregate ceiling rides along
  })

  it("still matches chains on the invisible 'playbook' pseudo-phase; process results unchanged", () => {
    const { getByLabelText, container } = render(<FatProcessSearch rows={ROWS} />)
    type(getByLabelText('Search processes'), 'playbook')
    expect(within(container as HTMLElement).getByText('Company in a day')).toBeDefined()

    type(getByLabelText('Search processes'), 'payroll')
    const link = within(container as HTMLElement).getByText('Run payroll').closest('a') as HTMLElement
    expect(link.getAttribute('href')).toBe('/processes/run-payroll')
    expect(within(link).queryByText('playbook')).toBeNull()
  })
})
