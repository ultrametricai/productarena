import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadAiStacks, resolveStack } from '@/lib/aiStacks'
import { loadAll } from '@/lib/data'

const DATA_DIR = path.resolve(__dirname, '../../data')

describe('ai-stacks data', () => {
  it('parses and every arena-top slot references a real arena id', () => {
    const stacks = loadAiStacks(DATA_DIR)
    expect(stacks.length).toBeGreaterThan(0)
    const arenaIds = new Set(loadAll(DATA_DIR).map((c) => c.category.id))
    for (const stack of stacks) {
      for (const slot of stack.slots) {
        if (slot.pick.kind === 'arena-top') {
          expect(arenaIds.has(slot.pick.arenaId), `${stack.id}/${slot.role}: unknown arena ${slot.pick.arenaId}`).toBe(true)
        }
      }
    }
  })
})

describe('resolveStack', () => {
  it('resolves arena-top slots to the metric leader and keeps editorial slots labeled', () => {
    const categories = loadAll(DATA_DIR)
    const stacks = loadAiStacks(DATA_DIR)
    for (const stack of stacks) {
      const resolved = resolveStack(stack, categories)
      expect(resolved.slots.length).toBeGreaterThan(0)
      for (const slot of resolved.slots) {
        if (slot.kind === 'arena-top') {
          expect(slot.productId).toBeTruthy()
          expect(slot.metricValue).not.toBeNull()
          const data = categories.find((c) => c.category.id === slot.arenaId)!
          const best = Math.max(
            ...data.rankings.leaderboard
              .map((e) => e[slot.metric as 'agentReady' | 'aiEra' | 'agenticApp'])
              .filter((v): v is number => v !== null),
          )
          expect(slot.metricValue).toBe(best)
        } else {
          expect(slot.editorialName).toBeTruthy()
          expect(slot.editorialNote).toBeTruthy()
        }
      }
    }
  })

  it('drops arena-top slots whose arena is not loaded instead of throwing', () => {
    const categories = loadAll(DATA_DIR)
    const stack = {
      id: 'test-stack',
      name: 'Test',
      tagline: 't',
      audience: 'a',
      slots: [
        { role: 'A', why: 'w', pick: { kind: 'arena-top' as const, arenaId: 'no-such-arena', metric: 'agentReady' as const } },
        { role: 'B', why: 'w', pick: { kind: 'arena-top' as const, arenaId: 'ai-coding', metric: 'agentReady' as const } },
      ],
    }
    const resolved = resolveStack(stack, categories)
    expect(resolved.slots.map((s) => s.role)).toEqual(['B'])
  })
})
