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

  it('renders the site-specific risk sections layered on the Ultrametric base terms', () => {
    render(<TermsPage />)
    // Base terms incorporation
    const base = screen.getByRole('link', { name: 'Ultrametric Terms of Service' })
    expect(base.getAttribute('href')).toBe('https://ultrametric.ai/tos')
    // Not-professional-advice: covers guides as well as rankings, and names the advice kinds
    expect(screen.getByRole('heading', { name: 'Research, not professional advice' })).toBeDefined()
    expect(screen.getByText(/not legal, tax, accounting,\s*financial, investment, immigration/)).toBeDefined()
    // Trademarks / no endorsement, with the standing-affiliation disclosure deep link
    expect(screen.getByRole('heading', { name: 'Trademarks, no endorsement' })).toBeDefined()
    expect(
      screen.getByRole('link', { name: 'bias disclosure' }).getAttribute('href'),
    ).toBe('/methodology#bias-disclosure')
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

  it('renders the strengthened exclusions (founder liability pass 2026-10-02)', () => {
    render(<TermsPage />)
    // Accuracy: evidence-based but never guaranteed accurate/complete/current
    expect(screen.getByRole('heading', { name: 'Accuracy: evidence, not guarantees' })).toBeDefined()
    expect(screen.getByText(/do not guarantee that\s*anything is accurate, complete, or current/)).toBeDefined()
    // Warranty disclaimer + liability exclusion to the maximum extent permitted by law
    expect(screen.getByRole('heading', { name: 'No warranties, no liability' })).toBeDefined()
    expect(screen.getByText(/merchantability, fitness for a\s*particular purpose, and non-infringement/)).toBeDefined()
    expect(screen.getByText(/indirect,\s*incidental, special, consequential, or punitive damages/)).toBeDefined()
    // Third-party links, including the open-documents chips on process steps
    expect(screen.getByRole('heading', { name: 'Third-party links and documents' })).toBeDefined()
    expect(screen.getByText(/open-documents chips on process steps/)).toBeDefined()
  })
})
