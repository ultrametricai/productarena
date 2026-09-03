// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import YcBadge from '@/components/YcBadge'

describe('YcBadge', () => {
  it('renders the YC batch pill when ycBatch is present', () => {
    render(<YcBadge ycBatch="S22" />)
    expect(screen.getByText('YC S22')).toBeDefined()
  })

  it('surfaces the batch in the title for clarity', () => {
    const { container } = render(<YcBadge ycBatch="W17" />)
    expect(container.querySelector('[title]')?.getAttribute('title')).toBe('Y Combinator batch W17')
  })

  it('renders nothing when ycBatch is absent', () => {
    const { container } = render(<YcBadge ycBatch={undefined} />)
    expect(container.textContent).toBe('')
  })
})
