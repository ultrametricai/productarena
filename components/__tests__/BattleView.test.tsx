// @vitest-environment jsdom
import { render } from '@testing-library/react'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import BattleView from '@/components/BattleView'
import { loadCategory, verdictFor } from '@/lib/data'

// Founder batch 2026-09-30, item 2: /vs/[pair] (and the /arena/*/battle/* mirror — both render
// this component) must read as a compact scorecard first. Contract pinned here:
//   1. COMPACT BY DEFAULT — every round is a native <details> disclosure and none ships open.
//   2. EXPANDABLE, NOTHING DELETED — the full per-round analysis (rationale, citations) still
//      renders inside the expander, in the served HTML, for every round.
const data = loadCategory('desktop-os', path.resolve(__dirname, '../../data'))
const battle = data.rankings.battles[0]

describe('BattleView compact scorecard (founder 2026-09-30)', () => {
  it('renders every round as a closed-by-default <details> with a one-line <summary> verdict', () => {
    const { container } = render(<BattleView data={data} battle={battle} />)
    const details = container.querySelectorAll('li > details')
    expect(details.length).toBe(battle.rounds.length)
    for (const d of details) {
      // Closed by default: the compact line is all a first read sees.
      expect(d.hasAttribute('open')).toBe(false)
      expect(d.querySelector('summary')).not.toBeNull()
    }
  })

  it('keeps the full analysis reachable inside the expanders — every rationale still in the HTML', () => {
    const { container } = render(<BattleView data={data} battle={battle} />)
    const text = container.textContent ?? ''
    for (const round of battle.rounds) {
      for (const productId of [battle.a, battle.b]) {
        const v = verdictFor(data, productId, round.storyId)
        expect(text).toContain(v.rationale)
      }
    }
  })

  it('the summary line names the round result from the committed winner — never recomputed', () => {
    const { container } = render(<BattleView data={data} battle={battle} />)
    const decided = battle.rounds.find((r) => r.winner === 'a' || r.winner === 'b')
    if (!decided) return // corpus-dependent; the other pins still hold
    const winnerName = data.products.find(
      (p) => p.id === (decided.winner === 'a' ? battle.a : battle.b),
    )!.name
    const summaries = [...container.querySelectorAll('summary')].map((s) => s.textContent ?? '')
    expect(summaries.some((s) => s.includes(`→ ${winnerName}`))).toBe(true)
  })
})
