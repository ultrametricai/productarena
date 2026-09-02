// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MomentumChip from '@/components/MomentumChip'

describe('MomentumChip', () => {
  it('renders stars and stars/yr when both present', () => {
    render(<MomentumChip popularity={{ stars: 12_400, starsPerYear: 2_100, fetchedAt: '2026-08-27T00:00:00.000Z' }} />)
    expect(screen.getByText('★ 12.4k')).toBeDefined()
    expect(screen.getByText('▲ 2.1k/yr')).toBeDefined()
  })

  it('renders npm weekly downloads', () => {
    render(<MomentumChip popularity={{ npmWeekly: 890_000, fetchedAt: '2026-08-27T00:00:00.000Z' }} />)
    expect(screen.getByText('npm 890k/wk')).toBeDefined()
  })

  it('renders pypi weekly downloads', () => {
    render(<MomentumChip popularity={{ pypiWeekly: 520_890, fetchedAt: '2026-08-27T00:00:00.000Z' }} />)
    expect(screen.getByText('pypi 520.9k/wk')).toBeDefined()
  })

  it('renders nothing (compact) when there is no signal', () => {
    const { container } = render(<MomentumChip popularity={undefined} compact />)
    expect(container.textContent).toBe('')
  })

  it('renders nothing (compact) for a fetch-attempted-but-empty record', () => {
    const { container } = render(<MomentumChip popularity={{ fetchedAt: '2026-08-27T00:00:00.000Z' }} compact />)
    expect(container.textContent).toBe('')
  })

  it('renders a muted "no public signals" in the non-compact (default) variant', () => {
    render(<MomentumChip popularity={undefined} />)
    expect(screen.getByText('no public signals')).toBeDefined()
  })

  it('surfaces fetchedAt in the title for freshness', () => {
    const { container } = render(<MomentumChip popularity={{ stars: 10, fetchedAt: '2026-08-27T00:00:00.000Z' }} />)
    expect(container.querySelector('[title]')?.getAttribute('title')).toContain('2026-08-27')
  })
})
