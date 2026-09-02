// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import ClaimsChip from '@/components/ClaimsChip'
import { loadCategory } from '@/lib/data'

const DATA_DIR = path.resolve(__dirname, '../../data')

describe('ClaimsChip', () => {
  it('renders "{verified}/{claimed} claims verified" for a product with mapped claims', () => {
    const data = loadCategory('code-hosting', DATA_DIR)
    render(<ClaimsChip data={data} productId="github" />)
    expect(screen.getByText(/claims verified/)).toBeDefined()
  })

  it('renders a muted dash when nothing is claimed for the product', () => {
    const data = loadCategory('code-hosting', DATA_DIR)
    const noClaims = { ...data, claims: {} }
    render(<ClaimsChip data={noClaims} productId="github" />)
    expect(screen.getByText('—')).toBeDefined()
  })

  it('carries the full bucket breakdown in the title tooltip', () => {
    const data = loadCategory('code-hosting', DATA_DIR)
    const { container } = render(<ClaimsChip data={data} productId="github" />)
    const title = container.querySelector('[title]')?.getAttribute('title')
    expect(title).toContain('verified')
    expect(title).toContain('contradicted')
  })
})
