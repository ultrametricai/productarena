// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPage from '@/app/privacy/page'

describe('privacy page', () => {
  it('renders the PA-specific data practices and the base-policy link', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy' })).toBeDefined()
    // Base policy incorporation
    const base = screen.getByRole('link', { name: 'Ultrametric Privacy Policy' })
    expect(base.getAttribute('href')).toBe('https://ultrametric.ai/privacy')
    // The four data surfaces: GA, KV compare counter, local watchlist, WorkOS login email
    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Compare counter' })).toBeDefined()
    expect(screen.getByText(/no IP addresses, no user agents/)).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Watchlist' })).toBeDefined()
    expect(screen.getByText(/never leaves your device/)).toBeDefined()
    expect(screen.getByRole('heading', { name: 'If you log in' })).toBeDefined()
    expect(screen.getByText(/the email is the only personal information we hold/)).toBeDefined()
    // No sale of data
    expect(screen.getByRole('heading', { name: 'No sale of data' })).toBeDefined()
    // Contact + cross-link back to terms
    expect(screen.getAllByRole('link', { name: 'legal@ultrametric.ai' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'terms' })).toBeDefined()
  })
})
