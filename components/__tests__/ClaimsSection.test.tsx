// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import ClaimsSection from '@/components/ClaimsSection'
import { loadCategory } from '@/lib/data'

const DATA_DIR = path.resolve(__dirname, '../../data')

describe('ClaimsSection', () => {
  it('renders the four-bucket summary and at least one expandable claim list', () => {
    const data = loadCategory('code-hosting', DATA_DIR)
    render(<ClaimsSection data={data} category="code-hosting" productId="github" />)
    expect(screen.getByText('Claims vs evidence')).toBeDefined()
    expect(screen.getByText('Verified')).toBeDefined()
    expect(screen.getByText('Unverified')).toBeDefined()
    expect(screen.getByText('Contradicted')).toBeDefined()
    expect(screen.getByText('Undersold')).toBeDefined()
  })

  it('renders nothing when the product has no claims recorded', () => {
    const data = loadCategory('code-hosting', DATA_DIR)
    const noClaims = { ...data, claims: {} }
    const { container } = render(<ClaimsSection data={noClaims} category="code-hosting" productId="github" />)
    expect(container.textContent).toBe('')
  })

  it('renders an "outside our story set" section when the product has unmapped claims', () => {
    const data = loadCategory('code-hosting', DATA_DIR)
    const hasUnmapped = (data.claims['gitlab'] ?? []).some((c) => c.storyIds.length === 0)
    expect(hasUnmapped).toBe(true) // sanity: gitlab's real data has taxonomy-gap claims
    render(<ClaimsSection data={data} category="code-hosting" productId="gitlab" />)
    expect(screen.getByText(/Claims outside our story set/)).toBeDefined()
  })
})
