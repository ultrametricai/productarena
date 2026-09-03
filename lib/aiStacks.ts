import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { CategoryData } from './data-helpers'

// Cross-arena curated stacks (data/ai-stacks.json): named bundles of one pick per role, where a
// pick is either resolved LIVE from an arena's leaderboard ("arena-top" — the pick moves when
// the evidence moves, so the page can never go stale) or an explicitly-labeled editorial call
// for layers we don't score yet (local models, hardware). Distinct from lib/stacks.ts (composed
// best-of-N coverage within ONE category) and lib/personaStacks.ts (best single product per
// persona within one category): this composes across ARENAS.

const ArenaTopPickSchema = z.object({
  kind: z.literal('arena-top'),
  arenaId: z.string().min(1),
  metric: z.enum(['agentReady', 'aiEra', 'agenticApp']),
})

const EditorialPickSchema = z.object({
  kind: z.literal('editorial'),
  name: z.string().min(1),
  url: z.string().url(),
  note: z.string().min(1),
})

const AiStackSlotSchema = z.object({
  role: z.string().min(1),
  why: z.string().min(1),
  pick: z.discriminatedUnion('kind', [ArenaTopPickSchema, EditorialPickSchema]),
})

export const AiStackSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  tagline: z.string().min(1),
  audience: z.string().min(1),
  slots: z.array(AiStackSlotSchema).min(2),
})

export type AiStack = z.infer<typeof AiStackSchema>
export type AiStackSlot = z.infer<typeof AiStackSlotSchema>

export function loadAiStacks(dataDir = path.join(process.cwd(), 'data')): AiStack[] {
  const raw = JSON.parse(fs.readFileSync(path.join(dataDir, 'ai-stacks.json'), 'utf8'))
  return z.array(AiStackSchema).parse(raw)
}

export interface ResolvedSlot {
  role: string
  why: string
  kind: 'arena-top' | 'editorial'
  // arena-top fields (null for editorial slots)
  arenaId: string | null
  arenaName: string | null
  productId: string | null
  productName: string | null
  metric: string | null
  metricValue: number | null
  rank: number | null
  fieldSize: number | null
  runnerUpName: string | null
  // editorial fields (null for arena-top slots)
  editorialName: string | null
  editorialUrl: string | null
  editorialNote: string | null
}

export interface ResolvedStack {
  id: string
  name: string
  tagline: string
  audience: string
  slots: ResolvedSlot[]
}

const METRIC_LABELS: Record<string, string> = {
  agentReady: 'agent-ready',
  aiEra: 'Arena Score',
  agenticApp: 'AI-native',
}

export function metricLabel(metric: string): string {
  return METRIC_LABELS[metric] ?? metric
}

// Resolve one stack against loaded category data. An arena-top slot whose arena isn't loaded
// (not yet built, or filtered out) resolves to null and the caller drops the slot — a stack
// must degrade to its still-live slots rather than break the page.
export function resolveStack(stack: AiStack, categories: CategoryData[]): ResolvedStack {
  const byId = new Map(categories.map((c) => [c.category.id, c]))
  const slots: ResolvedSlot[] = []

  for (const slot of stack.slots) {
    if (slot.pick.kind === 'editorial') {
      slots.push({
        role: slot.role,
        why: slot.why,
        kind: 'editorial',
        arenaId: null,
        arenaName: null,
        productId: null,
        productName: null,
        metric: null,
        metricValue: null,
        rank: null,
        fieldSize: null,
        runnerUpName: null,
        editorialName: slot.pick.name,
        editorialUrl: slot.pick.url,
        editorialNote: slot.pick.note,
      })
      continue
    }

    const data = byId.get(slot.pick.arenaId)
    if (!data) continue
    const metric = slot.pick.metric
    const ranked = [...data.rankings.leaderboard]
      .filter((e) => e[metric] !== null)
      .sort((a, b) => (b[metric] as number) - (a[metric] as number))
    const top = ranked[0]
    if (!top) continue
    const nameOf = (pid: string) => data.products.find((p) => p.id === pid)?.name ?? pid

    slots.push({
      role: slot.role,
      why: slot.why,
      kind: 'arena-top',
      arenaId: data.category.id,
      arenaName: data.category.name,
      productId: top.productId,
      productName: nameOf(top.productId),
      metric,
      metricValue: top[metric] as number,
      rank: 1,
      fieldSize: data.rankings.leaderboard.length,
      runnerUpName: ranked[1] ? nameOf(ranked[1].productId) : null,
      editorialName: null,
      editorialUrl: null,
      editorialNote: null,
    })
  }

  return { id: stack.id, name: stack.name, tagline: stack.tagline, audience: stack.audience, slots }
}

export function resolveAllStacks(categories: CategoryData[], dataDir?: string): ResolvedStack[] {
  return loadAiStacks(dataDir).map((s) => resolveStack(s, categories))
}
