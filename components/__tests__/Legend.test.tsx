// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Legend from '@/components/Legend'

describe('Legend', () => {
  it('renders verdict chips (with their glyphs) and proof vocabulary', () => {
    render(<Legend defaultOpen />)
    // Verdict chips carry the compact glyph inside the chip — one merged vocabulary.
    expect(screen.getByText('✓ full')).toBeDefined()
    expect(screen.getByText('~ partial')).toBeDefined()
    expect(screen.getByText('! disputed')).toBeDefined()
    expect(screen.getByText('— none')).toBeDefined()
    expect(screen.getAllByText('n/a').length).toBeGreaterThan(0)
    expect(screen.getByText(/question doesn't apply to this kind of product/)).toBeDefined()
    // Proof chips pair the StoryMatrix letter with its word.
    expect(screen.getByText('C claimed')).toBeDefined()
    expect(screen.getByText(/vendor claim only/)).toBeDefined()
    expect(screen.getByText('X community')).toBeDefined()
    expect(screen.getByText(/users back it/)).toBeDefined()
    expect(screen.getByText('T probed')).toBeDefined()
    expect(screen.getByText(/tested by us/)).toBeDefined()
    expect(screen.getByText('D contradicted')).toBeDefined()
    expect(screen.getByText(/evidence disagrees/)).toBeDefined()
    expect(screen.getAllByText(/Arena Score/).length).toBeGreaterThan(0)
  })

  it('accepts a custom id for anchor linking', () => {
    render(<Legend id="custom-legend" defaultOpen />)
    expect(document.getElementById('custom-legend')).not.toBeNull()
  })
})
