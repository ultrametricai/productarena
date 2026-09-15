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

  it('wears YC brand orange with white text so it reads as the YC mark', () => {
    const { container } = render(<YcBadge ycBatch="S22" />)
    const cls = container.querySelector('a, span')?.className ?? ''
    expect(cls).toContain('bg-[#f26522]')
    expect(cls).toContain('text-white')
  })

  it('renders nothing when ycBatch is absent', () => {
    const { container } = render(<YcBadge ycBatch={undefined} />)
    expect(container.textContent).toBe('')
  })

  it('links to the batch ranking page (lowercase code)', () => {
    const { container } = render(<YcBadge ycBatch="X25" />)
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/yc/x25')
  })

  it('renders a plain span when clickable is false (for use inside another link)', () => {
    const { container } = render(<YcBadge ycBatch="S22" clickable={false} />)
    expect(container.querySelector('a')).toBeNull()
    expect(screen.getByText('YC S22')).toBeDefined()
  })
})
