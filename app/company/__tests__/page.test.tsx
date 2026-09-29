// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CompanyPage from '@/app/company/page'

describe('company page (AFK product page ported from the landing)', () => {
  it('renders the hero and the waitlist forms', () => {
    const { container } = render(<CompanyPage />)
    expect(screen.getByRole('heading', { level: 1, name: /Build an\s*AI native business/ })).toBeDefined()
    // Two waitlist forms (hero + final CTA), both posting the AFK target to the auth backend.
    const forms = [...container.querySelectorAll('form')]
    expect(forms).toHaveLength(2)
    for (const form of forms) {
      expect(form.getAttribute('action')).toBe('/auth/join')
      expect(form.getAttribute('method')).toBe('post')
      expect(form.querySelector('input[name="target"]')?.getAttribute('value')).toBe('afk')
    }
    expect(screen.getAllByRole('button', { name: 'Join the Ultrametric waitlist' })).toHaveLength(2)
  })

  it('renders all eight feature cards', () => {
    render(<CompanyPage />)
    for (const feature of [
      'Cross-vendor control',
      'Context-aware setup',
      'Intelligent field filling',
      'Goal-driven AI',
      'Approval gates',
      'Connected process steps',
      'Security Engineered',
      'Built for teams',
    ]) {
      expect(screen.getByRole('heading', { level: 3, name: feature })).toBeDefined()
    }
  })

  it('renders the workspace mock and the integrations grid', () => {
    render(<CompanyPage />)
    expect(screen.getByText('Watch your dream business set itself up.')).toBeDefined()
    // The static frame of the animated walkthrough: workspace sidebar + integration panels.
    expect(screen.getByText('Orchestrator')).toBeDefined()
    expect(screen.getByText('QuickBooks')).toBeDefined()
    // Vendor tiles (landing svg logos now in public/logos/).
    expect(screen.getByAltText('Mercury logo').getAttribute('src')).toBe('/logos/mercury.svg')
    expect(screen.getByAltText('Clerky logo').getAttribute('src')).toBe('/logos/clerky.svg')
    expect(screen.getByText('and many more')).toBeDefined()
  })

  it('renders the Backed by builders grid', () => {
    render(<CompanyPage />)
    expect(screen.getByText('Backed by builders')).toBeDefined()
    expect(screen.getByText('Tomer London')).toBeDefined()
  })
})
