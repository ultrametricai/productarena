// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TosPage, { metadata } from '@/app/tos/page'

describe('tos page (company Terms of Service ported verbatim from the landing)', () => {
  it('renders the title, date, and opening text', () => {
    render(<TosPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ultrametric Terms of Service' })).toBeDefined()
    expect(screen.getByText(/May 14, 2026/)).toBeDefined()
    expect(screen.getByText(/a Delaware corporation/)).toBeDefined()
  })

  it('renders representative sections of the verbatim terms text', () => {
    render(<TosPage />)
    expect(screen.getByRole('heading', { name: '1. Description of the Services' })).toBeDefined()
    expect(screen.getByText(/Executable automated workflows and agents/)).toBeDefined()
    expect(screen.getByText(/Failure to enforce any provision is not a waiver/)).toBeDefined()
    expect(screen.getByRole('heading', { name: '33. Contact' })).toBeDefined()
    const email = screen.getAllByRole('link', { name: 'legal@ultrametric.ai' })
    expect(email.length).toBeGreaterThan(0)
    expect(email[0].getAttribute('href')).toBe('mailto:legal@ultrametric.ai')
  })

  it('declares the /tos canonical (the page keeps its landing URL)', () => {
    expect(metadata.alternates?.canonical).toBe('https://ultrametric.ai/tos')
  })
})
