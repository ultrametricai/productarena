// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TermsPage from '@/app/terms/page'

describe('terms page', () => {
  it('renders the copyright, watermark notice, and no-liability disclaimer', () => {
    render(<TermsPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of use' })).toBeDefined()
    expect(screen.getByText(/© 2026 Ultrametric Inc, all rights reserved/)).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Watermark' })).toBeDefined()
    expect(screen.getByText(/accepts no responsibility for decisions/)).toBeDefined()
  })

  it('renders the PA-specific risk sections layered on the Ultrametric base terms', () => {
    render(<TermsPage />)
    // Base terms incorporation
    const base = screen.getByRole('link', { name: 'Ultrametric Terms of Service' })
    expect(base.getAttribute('href')).toBe('https://ultrametric.ai/tos')
    // Opinions-not-advice
    expect(screen.getByRole('heading', { name: 'Rankings are opinions, not advice' })).toBeDefined()
    expect(screen.getByText(/not professional advice/)).toBeDefined()
    // Trademarks
    expect(screen.getByRole('heading', { name: 'Trademarks and affiliation' })).toBeDefined()
    // Dispute path is the flag mechanism
    expect(screen.getByRole('heading', { name: 'Disputes: flag it' })).toBeDefined()
    expect(
      screen.getByRole('link', { name: 'GitHub issue' }).getAttribute('href'),
    ).toContain('flag-verdict.yml')
    // Scraping/API limits live in "What you may not do"
    expect(screen.getByText(/not a bulk-export channel/)).toBeDefined()
    // Cross-link to privacy
    expect(screen.getByRole('link', { name: 'privacy' })).toBeDefined()
  })
})
