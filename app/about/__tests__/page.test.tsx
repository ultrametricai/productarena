// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutPage from '@/app/about/page'

describe('about page (simplified — founder 2026-09-30: one short paragraph + the founders)', () => {
  it('renders the heading and exactly one short body paragraph', () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'About Ultrametric' })).toBeDefined()
    expect(screen.getByText(/We started Ultrametric to automate the boring processes/)).toBeDefined()
    // The old cards/doctrine/founder-note sections are gone.
    expect(screen.queryByText('Everything evidence-driven.')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'A note from Jude & Tyler' })).toBeNull()
  })

  it('shows Jude and Tyler as circular profile images at the bottom, linking their GitHub profiles', () => {
    render(<AboutPage />)
    for (const [name, handle] of [
      ['Jude Gomila', 'judegomila'],
      ['Tyler Lastovich', 'tylerlastovich'],
    ] as const) {
      const img = screen.getByAltText(name)
      // Committed local asset (public/people/), rendered as a circle.
      expect(img.getAttribute('src')).toMatch(/^\/people\//)
      expect(img.className).toContain('rounded-full')
      const link = img.closest('a')
      expect(link?.getAttribute('href')).toBe(`https://github.com/${handle}`)
    }
  })
})
