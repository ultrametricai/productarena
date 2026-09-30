// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ReversibilityBadge from '@/components/ReversibilityBadge'
import { REVERSIBILITY_META } from '@/lib/processSim'

describe('ReversibilityBadge', () => {
  it('renders NOTHING for reversible — the badge marks doors that close, not the default state', () => {
    const { container } = render(<ReversibilityBadge tier="reversible" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the amber "hard to undo" marker for painful, with the definition as tooltip', () => {
    const { container, getByTitle } = render(<ReversibilityBadge tier="painful" />)
    expect(container.textContent).toContain('⚠')
    expect(container.textContent).toContain('hard to undo')
    const el = getByTitle(REVERSIBILITY_META.painful.definition)
    expect(el.className).toContain('amber')
  })

  it('renders the red "irreversible" marker for irreversible, with the definition as tooltip', () => {
    const { container, getByTitle } = render(<ReversibilityBadge tier="irreversible" />)
    expect(container.textContent).toContain('⛔')
    expect(container.textContent).toContain('irreversible')
    const el = getByTitle(REVERSIBILITY_META.irreversible.definition)
    expect(el.className).toContain('red')
  })
})
