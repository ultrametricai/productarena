// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPage from '@/app/privacy/page'

describe('privacy page', () => {
  it('renders the restored company Privacy Policy with the site-specific section', () => {
    render(<PrivacyPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ultrametric Privacy Policy' })
    ).toBeDefined()

    // The plain-language site-specific section (current reality, verified against the code)
    expect(screen.getByRole('heading', { name: 'This website, concretely' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeDefined()
    expect(screen.getByText(/Google Analytics 4/)).toBeDefined()
    expect(screen.getByText(/PostHog product analytics/)).toBeDefined()
    expect(screen.getByText(/session recording is disabled/)).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Compare counter' })).toBeDefined()
    expect(screen.getByText(/no IP addresses, no user agents/)).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Preferences stored in your browser' })).toBeDefined()
    expect(screen.getByText('pa-geo')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'If you log in' })).toBeDefined()
    expect(screen.getAllByText('pa_session', { selector: 'code' }).length).toBeGreaterThan(0)
    expect(screen.getByText(/the only personal information we hold/)).toBeDefined()
    expect(screen.getByText(/Workers KV, keyed by your user id/)).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Abuse protection' })).toBeDefined()
    expect(screen.getByText(/SHA-256 hash of the IP/)).toBeDefined()
    expect(screen.getByText(/no raw IP addresses\s+at rest/)).toBeDefined()

    // The restored formal policy sections (the landing site's thorough base policy)
    expect(screen.getByRole('heading', { name: '1. Scope' })).toBeDefined()
    expect(screen.getByRole('heading', { name: '2. Information We Collect' })).toBeDefined()
    expect(screen.getByRole('heading', { name: '4.1 Training and Improving Models' })).toBeDefined()
    expect(screen.getByRole('heading', { name: /California Privacy Rights/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: '7. Data Retention' })).toBeDefined()
    expect(screen.getByRole('heading', { name: '14. Contact Us' })).toBeDefined()

    // Fits into the ToS: links to the base ToS and the rankings-specific terms, no circular
    // external "base policy" link (this page IS ultrametric.ai/privacy now)
    const tos = screen.getByRole('link', { name: 'Ultrametric Terms of Service' })
    expect(tos.getAttribute('href')).toBe('/tos')
    const terms = screen.getByRole('link', { name: 'terms of use' })
    expect(terms.getAttribute('href')).toBe('/terms')
    expect(screen.queryByRole('link', { name: 'Ultrametric Privacy Policy' })).toBeNull()

    // Contact
    expect(screen.getAllByRole('link', { name: 'legal@ultrametric.ai' }).length).toBeGreaterThan(0)
  })
})
