// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import LeaderboardTable from '@/components/LeaderboardTable'
import { loadCategory } from '@/lib/data'

describe('LeaderboardTable', () => {
  it('renders every product with its score and an agenticness indicator', () => {
    const data = loadCategory('desktop-os', path.resolve(__dirname, '../../data'))
    render(<LeaderboardTable data={data} />)
    for (const p of data.products) {
      expect(screen.getByText(p.name)).toBeDefined()
    }
    const first = data.rankings.leaderboard[0]
    expect(screen.getByText(first.score.toFixed(1))).toBeDefined()
    expect(screen.getAllByText(/AGENT-READY/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/AGENTIC/).length).toBeGreaterThan(0)
  })
})
