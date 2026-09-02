// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import UncertaintyMarker from '@/components/UncertaintyMarker'

describe('UncertaintyMarker', () => {
  it('renders nothing when no uncertainty entry was recorded', () => {
    const { container } = render(<UncertaintyMarker agreement={undefined} />)
    expect(container.textContent).toBe('')
  })

  it('renders nothing for a stable 3/3', () => {
    const { container } = render(<UncertaintyMarker agreement="3/3" />)
    expect(container.textContent).toBe('')
  })

  it('renders the ± glyph with a tooltip for a 2/3 split', () => {
    render(<UncertaintyMarker agreement="2/3" />)
    const marker = screen.getByText('±')
    expect(marker.getAttribute('title')).toBe('judges split 2/3 — treat as uncertain')
  })

  it('renders the ± glyph for a 1/3 split', () => {
    render(<UncertaintyMarker agreement="1/3" />)
    expect(screen.getByText('±')).toBeDefined()
  })
})
