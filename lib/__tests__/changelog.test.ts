import { describe, expect, it } from 'vitest'
import {
  capChangelog, dayOf, deriveChangelog, groupByDay, historyBegins,
  type ArenaHistoryInput, type ChangeEvent,
} from '@/lib/changelog'

function entry(productId: string, date: string, aiEra: number | null, agentReady: number | null = null) {
  return { productId, date, aiEra, agentReady }
}

// Epoch arena: tracked since the site-wide earliest day (Aug 28) — launching it is not an event.
const arenaA: ArenaHistoryInput = {
  categoryId: 'ai-coding',
  categoryName: 'AI Coding Agents',
  productNames: { x: 'Xcode Pilot', y: 'Yolo Code', z: 'Zed Agent' },
  entries: [
    entry('x', '2026-08-28T00:00:00Z', 50),
    entry('y', '2026-08-28T00:00:00Z', 48),
    // y jumps +3.0 and overtakes x.
    entry('y', '2026-09-02T00:00:00Z', 51),
    // z starts being tracked later — a product addition, not an overtake (it was never ranked
    // before, even though it lands at #1).
    entry('z', '2026-09-03T00:00:00Z', 60),
  ],
}

// Launched after the epoch → an arena-launched event with its day-one product count.
const arenaB: ArenaHistoryInput = {
  categoryId: 'terminals',
  categoryName: 'Terminals',
  productNames: { warp: 'Warp', kitty: 'kitty' },
  entries: [
    entry('warp', '2026-09-05T10:00:00Z', 40),
    entry('kitty', '2026-09-05T10:00:00Z', 35),
  ],
}

describe('historyBegins', () => {
  it('is the earliest recorded UTC day across all arenas, null with no history', () => {
    expect(historyBegins([arenaA, arenaB])).toBe('2026-08-28')
    expect(historyBegins([])).toBeNull()
    // Offsets normalize: 17:00-07:00 is already the next UTC day.
    expect(historyBegins([{ ...arenaB, entries: [entry('warp', '2026-09-04T17:00:01-07:00', 40)] }])).toBe('2026-09-05')
  })
})

describe('deriveChangelog', () => {
  const events = deriveChangelog([arenaA, arenaB])

  it('emits arena-launched only for arenas newer than the site epoch, with day-one product count', () => {
    const launches = events.filter((e) => e.kind === 'arena-launched')
    expect(launches).toEqual([
      { kind: 'arena-launched', date: '2026-09-05T10:00:00Z', categoryId: 'terminals', categoryName: 'Terminals', productCount: 2 },
    ])
  })

  it('emits product-added for products first tracked after their arena, not at arena launch', () => {
    const added = events.filter((e) => e.kind === 'product-added')
    expect(added).toEqual([
      { kind: 'product-added', date: '2026-09-03T00:00:00Z', categoryId: 'ai-coding', categoryName: 'AI Coding Agents', productId: 'z', productName: 'Zed Agent' },
    ])
  })

  it('emits an overtake when a previously-ranked product passes another, never for new entrants', () => {
    const overtakes = events.filter((e) => e.kind === 'overtake')
    expect(overtakes).toEqual([
      {
        kind: 'overtake',
        date: '2026-09-02T00:00:00Z',
        categoryId: 'ai-coding',
        categoryName: 'AI Coding Agents',
        productId: 'y',
        productName: 'Yolo Code',
        productAiEra: 51,
        overtookId: 'x',
        overtookName: 'Xcode Pilot',
        overtookAiEra: 50,
      },
    ])
  })

  it('emits score-move for consecutive aiEra changes ≥ 2.0', () => {
    const moves = events.filter((e) => e.kind === 'score-move')
    expect(moves).toEqual([
      { kind: 'score-move', date: '2026-09-02T00:00:00Z', categoryId: 'ai-coding', categoryName: 'AI Coding Agents', productId: 'y', productName: 'Yolo Code', delta: 3, to: 51 },
    ])
  })

  it('sorts newest first', () => {
    expect(events.map((e) => e.kind)).toEqual(['arena-launched', 'product-added', 'overtake', 'score-move'])
  })

  it('does not flip ranks on a tie (stable order) and treats null aiEra as unranked', () => {
    const arena: ArenaHistoryInput = {
      categoryId: 'c',
      categoryName: 'C',
      productNames: {},
      entries: [
        entry('a', '2026-09-01T00:00:00Z', 50),
        entry('b', '2026-09-01T00:00:00Z', 49),
        // b ties a: no overtake. a's aiEra goes null: unranked, but b passing a "by default"
        // is not a flip either (a is no longer ranked).
        entry('b', '2026-09-02T00:00:00Z', 50),
        entry('a', '2026-09-03T00:00:00Z', null),
      ],
    }
    const derived = deriveChangelog([arena, arenaA]) // arenaA sets an earlier epoch
    expect(derived.filter((e) => e.kind === 'overtake' && e.categoryId === 'c')).toEqual([])
  })

  it('ignores sub-threshold score moves', () => {
    const arena: ArenaHistoryInput = {
      categoryId: 'c',
      categoryName: 'C',
      productNames: {},
      entries: [entry('a', '2026-09-01T00:00:00Z', 50), entry('a', '2026-09-02T00:00:00Z', 51.9)],
    }
    expect(deriveChangelog([arena]).filter((e) => e.kind === 'score-move')).toEqual([])
  })
})

describe('capChangelog', () => {
  const day = (d: string): ChangeEvent => ({
    kind: 'arena-launched',
    date: `${d}T00:00:00Z`,
    categoryId: d,
    categoryName: d,
    productCount: 1,
  })

  it('keeps only the newest N distinct days with events', () => {
    const events = [day('2026-09-01'), day('2026-09-03'), day('2026-09-06')]
    const capped = capChangelog(events, 2, 200)
    expect(capped.map((e) => dayOf(e.date))).toEqual(['2026-09-06', '2026-09-03'])
  })

  it('caps total events', () => {
    const events = [day('2026-09-06'), day('2026-09-05'), day('2026-09-04')]
    expect(capChangelog(events, 30, 2)).toHaveLength(2)
  })
})

describe('groupByDay', () => {
  it('groups newest-first by UTC day', () => {
    const groups = groupByDay(deriveChangelog([arenaA, arenaB]))
    expect(groups.map(([d, evs]) => [d, evs.length])).toEqual([
      ['2026-09-05', 1],
      ['2026-09-03', 1],
      ['2026-09-02', 2],
    ])
  })
})
