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
    expect(screen.getByText(/accepts no\s+responsibility for decisions/)).toBeDefined()
  })
})
