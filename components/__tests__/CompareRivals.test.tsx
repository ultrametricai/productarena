// @vitest-environment jsdom
import { render } from '@testing-library/react'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import CompareRivals from '@/components/CompareRivals'
import { loadCategory } from '@/lib/data'
import type { CategoryData } from '@/lib/data-helpers'

const dataDir = path.resolve(__dirname, '../../data')
const banking = loadCategory('startup-banking', dataDir)

describe('CompareRivals', () => {
  it('renders self first and highlighted, 4 rivals linked, and the head-to-head record', () => {
    const { container } = render(<CompareRivals data={banking} productId="mercury" />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(5)
    // Self row: first, highlighted, no product link, em-dash in the vs cell.
    expect(rows[0].className).toContain('bg-emerald-500/5')
    expect(rows[0].textContent).toContain('Mercury')
    expect(rows[0].querySelector('a[href="/arena/startup-banking/product/mercury"]')).toBeNull()
    // Rival row links to its product page and to the /vs/ head-to-head with the stored slug;
    // record is oriented self-first (mercury 12 – 30 ramp in data/startup-banking/rankings.json).
    const rampRow = [...rows].find((r) => r.textContent?.includes('Ramp'))!
    expect(rampRow.querySelector('a[href="/arena/startup-banking/product/ramp"]')).not.toBeNull()
    const vsLink = rampRow.querySelector('a[href="/vs/mercury-vs-ramp"]')!
    expect(vsLink).not.toBeNull()
    expect(vsLink.textContent).toContain('12–30')
    // PA Score cells link to each product's /score receipt page.
    expect(rows[0].querySelector('a[href="/arena/startup-banking/product/mercury/score"]')).not.toBeNull()
    expect(rampRow.querySelector('a[href="/arena/startup-banking/product/ramp/score"]')).not.toBeNull()
    // Footer: the full-arena link.
    const footer = [...container.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/arena/startup-banking')
    expect(footer?.textContent).toContain('full arena')
  })

  it('renders n/a for the arena-declared naDimensions (processors: agentReady + apiQuality)', () => {
    const processors = loadCategory('processors', dataDir)
    const { container } = render(
      <CompareRivals data={processors} productId={processors.rankings.leaderboard[0].productId} />,
    )
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBeGreaterThanOrEqual(2)
    // Every row shows the arena-class n/a cell (with its explanatory tooltip) for BOTH na
    // dimensions — never a number, never a /score link for those columns.
    const naCells = container.querySelectorAll('td [title^="Not meaningful for this arena"]')
    expect(naCells).toHaveLength(rows.length * 2)
  })

  it('renders nothing for an arena with fewer than 2 products', () => {
    const solo: CategoryData = {
      category: { id: 'solo', name: 'Solo', description: '', personas: ['a developer'] },
      products: [{ id: 'only', name: 'Only', vendor: 'v', type: 'oss', urls: { site: 'https://example.com/only' } }],
      stories: [],
      evidence: {},
      verdicts: [],
      rankings: {
        generatedAt: '2026-01-01T00:00:00.000Z',
        leaderboard: [{ productId: 'only', score: 50, agentReady: null, agenticApp: null, apiQuality: null, aiEra: 50, applicable: 1, total: 1, themeScores: {} }],
        battles: [],
      },
      stacks: [],
      popularity: {},
      claims: {},
      uncertainty: [],
      vendorResponses: [],
      certifications: [],
    }
    const { container } = render(<CompareRivals data={solo} productId="only" />)
    expect(container.innerHTML).toBe('')
  })
})
