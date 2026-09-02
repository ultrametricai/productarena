// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Legend from '@/components/Legend'

describe('Legend', () => {
  it('renders verdict, verification, and glyph vocabulary', () => {
    render(<Legend defaultOpen />)
    expect(screen.getByText('full')).toBeDefined()
    expect(screen.getByText('partial')).toBeDefined()
    expect(screen.getAllByText('disputed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('none').length).toBeGreaterThan(0)
    expect(screen.getAllByText('n/a').length).toBeGreaterThan(0)
    expect(screen.getByText(/claimed/)).toBeDefined()
    expect(screen.getByText(/corroborated/)).toBeDefined()
    expect(screen.getByText(/tested/)).toBeDefined()
    expect(screen.getByText('✓')).toBeDefined()
    expect(screen.getByText('~')).toBeDefined()
    expect(screen.getByText('!')).toBeDefined()
    expect(screen.getByText('—')).toBeDefined()
    expect(screen.getAllByText(/INIT Score/).length).toBeGreaterThan(0)
  })

  it('accepts a custom id for anchor linking', () => {
    render(<Legend id="custom-legend" defaultOpen />)
    expect(document.getElementById('custom-legend')).not.toBeNull()
  })
})
