// Data-access layer over the ArenaClient — the same joins mcp/src/tools.ts performs (that
// package is the reference for these shapes), trimmed to what the CLI renders. Pure of any
// terminal concerns: functions here return plain data; commands.ts formats it.
import type { ArenaClient } from './client.js'
import { metricValue, type Metric } from './metrics.js'
import type { Category, LeaderboardEntry, Product, Rankings, Stack, StackMetric, Story, Verdict } from './types.js'

// Caller mistakes (unknown arena/product ids, bad metrics) — exit code 1, vs NetworkError's 2.
export class UsageError extends Error {}

export function fetchCategories(client: ArenaClient): Promise<Category[]> {
  return client.fetchJson<Category[]>('/data/categories.json')
}

export async function assertKnownArena(client: ArenaClient, arena: string): Promise<void> {
  const categories = await fetchCategories(client)
  if (!categories.some((c) => c.id === arena)) {
    throw new UsageError(`unknown arena "${arena}" — run \`productarena arenas\` for valid ids`)
  }
}

export interface ArenaListing extends Category {
  productCount: number
}

export async function listArenas(client: ArenaClient): Promise<ArenaListing[]> {
  const categories = await fetchCategories(client)
  return Promise.all(
    categories.map(async (category) => {
      const products = await client.fetchJson<Product[]>(`/data/${category.id}/products.json`).catch(() => [])
      return { ...category, productCount: products.length }
    }),
  )
}

export interface RankingsView {
  arena: string
  generatedAt: string
  rows: Array<{
    rank: number
    productId: string
    name: string
    type: Product['type']
    arenaScore: number | null
    agentReady: number | null
    agenticApp: number | null
    apiQuality: number | null
  }>
}

export async function getRankings(client: ArenaClient, arena: string): Promise<RankingsView> {
  await assertKnownArena(client, arena)
  const [rankings, products] = await Promise.all([
    client.fetchJson<Rankings>(`/data/${arena}/rankings.json`),
    client.fetchJson<Product[]>(`/data/${arena}/products.json`),
  ])
  const byId = new Map(products.map((p) => [p.id, p]))
  return {
    arena,
    generatedAt: rankings.generatedAt,
    rows: rankings.leaderboard.map((entry, i) => ({
      rank: i + 1,
      productId: entry.productId,
      name: byId.get(entry.productId)?.name ?? entry.productId,
      type: byId.get(entry.productId)?.type ?? 'commercial',
      arenaScore: entry.aiEra,
      agentReady: entry.agentReady,
      agenticApp: entry.agenticApp,
      apiQuality: entry.apiQuality,
    })),
  }
}

// Same story ids and strongest-verdict rule as lib/accessGlyphs.ts (MCP is two stories —
// server + client — and the stronger verdict wins).
const ACCESS_COLUMNS: Array<{ label: 'MCP' | 'CLI' | 'API'; storyIds: string[] }> = [
  { label: 'MCP', storyIds: ['agentic-mcp-server', 'agentic-mcp-client'] },
  { label: 'CLI', storyIds: ['agentic-official-cli'] },
  { label: 'API', storyIds: ['agentic-public-api'] },
]

const VERDICT_RANK: Record<Verdict['verdict'], number> = { full: 3, partial: 2, disputed: 1, none: 0, na: 0 }

export type AccessSummary = Record<'MCP' | 'CLI' | 'API', Verdict['verdict'] | null>

export function accessSummary(verdicts: Verdict[], productId: string): AccessSummary {
  const forProduct = verdicts.filter((v) => v.productId === productId)
  const out: AccessSummary = { MCP: null, CLI: null, API: null }
  for (const { label, storyIds } of ACCESS_COLUMNS) {
    let best: Verdict['verdict'] | null = null
    for (const id of storyIds) {
      const v = forProduct.find((x) => x.storyId === id)
      if (v && (best === null || VERDICT_RANK[v.verdict] > VERDICT_RANK[best])) best = v.verdict
    }
    out[label] = best
  }
  return out
}

export interface StoryHighlight {
  storyId: string
  title: string
  weight: number
  verdict: Verdict['verdict']
}

export interface ProductDetail {
  arena: string
  product: Product
  rank: number | null
  fieldSize: number
  entry: LeaderboardEntry | null
  access: AccessSummary
  verdictCounts: Record<Verdict['verdict'], number>
  topFull: StoryHighlight[]
  topNone: StoryHighlight[]
}

// Heaviest-first story highlights for one verdict tier — the "what it nails / where it's weak"
// lists on the product view.
export function storyHighlights(
  stories: Story[],
  verdicts: Verdict[],
  productId: string,
  tier: Verdict['verdict'],
  limit = 3,
): StoryHighlight[] {
  const titleById = new Map(stories.map((s) => [s.id, s]))
  return verdicts
    .filter((v) => v.productId === productId && v.verdict === tier)
    .map((v) => {
      const story = titleById.get(v.storyId)
      return { storyId: v.storyId, title: story?.title ?? v.storyId, weight: story?.weight ?? 0, verdict: v.verdict }
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
}

export async function getProduct(client: ArenaClient, arena: string, productId: string): Promise<ProductDetail> {
  await assertKnownArena(client, arena)
  const [products, stories, verdicts, rankings] = await Promise.all([
    client.fetchJson<Product[]>(`/data/${arena}/products.json`),
    client.fetchJson<Story[]>(`/data/${arena}/stories.json`),
    client.fetchJson<Verdict[]>(`/data/${arena}/verdicts.json`),
    client.fetchJson<Rankings>(`/data/${arena}/rankings.json`),
  ])
  const product = products.find((p) => p.id === productId)
  if (!product) {
    throw new UsageError(`unknown product "${productId}" in arena "${arena}" — run \`productarena rankings ${arena}\``)
  }
  const index = rankings.leaderboard.findIndex((e) => e.productId === productId)
  const verdictCounts: Record<Verdict['verdict'], number> = { full: 0, partial: 0, none: 0, disputed: 0, na: 0 }
  for (const v of verdicts) if (v.productId === productId) verdictCounts[v.verdict] += 1
  return {
    arena,
    product,
    rank: index === -1 ? null : index + 1,
    fieldSize: rankings.leaderboard.length,
    entry: index === -1 ? null : rankings.leaderboard[index],
    access: accessSummary(verdicts, productId),
    verdictCounts,
    topFull: storyHighlights(stories, verdicts, productId, 'full'),
    topNone: storyHighlights(stories, verdicts, productId, 'none'),
  }
}

interface IndexedProduct {
  arena: string
  product: Product
}

// Flat (arena, product) index across every category — product ids are globally unique.
async function productIndex(client: ArenaClient): Promise<IndexedProduct[]> {
  const categories = await fetchCategories(client)
  const perArena = await Promise.all(
    categories.map(async (category) => {
      const products = await client.fetchJson<Product[]>(`/data/${category.id}/products.json`).catch(() => [])
      return products.map((product) => ({ arena: category.id, product }))
    }),
  )
  return perArena.flat()
}

export interface CompareEntry {
  productId: string
  name: string
  vendor: string
  arena: string
  rank: number | null
  fieldSize: number
  score: number | null
  arenaScore: number | null
  agentReady: number | null
  agenticApp: number | null
  apiQuality: number | null
}

export interface CompareResult {
  products: CompareEntry[]
  notFound: string[]
  note: string
}

export const COMPARE_MAX = 6

// Mirrors the /compare page's cross-arena table (and mcp/src/tools.ts compare): each id is
// located via the flat index, then scored from its own arena's leaderboard.
export async function compareProducts(client: ArenaClient, productIds: string[]): Promise<CompareResult> {
  const ids = [...new Set(productIds.map((p) => p.trim().toLowerCase()).filter(Boolean))]
  if (ids.length === 0) throw new UsageError('compare needs at least one product id')
  if (ids.length > COMPARE_MAX) throw new UsageError(`compare caps at ${COMPARE_MAX} products (got ${ids.length})`)

  const index = await productIndex(client)
  const byId = new Map(index.map((entry) => [entry.product.id, entry]))
  const found = ids.filter((id) => byId.has(id))
  const notFound = ids.filter((id) => !byId.has(id))
  const arenas = [...new Set(found.map((id) => byId.get(id)!.arena))]
  const rankingsByArena = new Map(
    await Promise.all(
      arenas.map(async (arena) => [arena, await client.fetchJson<Rankings>(`/data/${arena}/rankings.json`)] as const),
    ),
  )

  const products: CompareEntry[] = found.map((id) => {
    const { arena, product } = byId.get(id)!
    const leaderboard = rankingsByArena.get(arena)?.leaderboard ?? []
    const rankIndex = leaderboard.findIndex((e) => e.productId === id)
    const entry = rankIndex === -1 ? null : leaderboard[rankIndex]
    return {
      productId: id,
      name: product.name,
      vendor: product.vendor,
      arena,
      rank: rankIndex === -1 ? null : rankIndex + 1,
      fieldSize: leaderboard.length,
      score: entry?.score ?? null,
      arenaScore: entry?.aiEra ?? null,
      agentReady: entry?.agentReady ?? null,
      agenticApp: entry?.agenticApp ?? null,
      apiQuality: entry?.apiQuality ?? null,
    }
  })

  return {
    products,
    notFound,
    note: 'Scores use the same formula everywhere, but each arena judges its own story set — cross-arena numbers are indicative, not a strict total ordering.',
  }
}

export interface TopEntry {
  productId: string
  name: string
  vendor: string
  type: Product['type']
  arena: string
  value: number
  arenaScore: number | null
}

export const TOP_LIMIT_DEFAULT = 10
export const TOP_LIMIT_MAX = 50

export async function topProducts(
  client: ArenaClient,
  metric: Metric,
  options: { limit?: number; ossOnly?: boolean } = {},
): Promise<TopEntry[]> {
  const capped = Math.max(1, Math.min(Math.floor(options.limit ?? TOP_LIMIT_DEFAULT), TOP_LIMIT_MAX))
  const categories = await fetchCategories(client)
  const perArena = await Promise.all(
    categories.map(async (category) => {
      const [products, rankings] = await Promise.all([
        client.fetchJson<Product[]>(`/data/${category.id}/products.json`).catch(() => null),
        client.fetchJson<Rankings>(`/data/${category.id}/rankings.json`).catch(() => null),
      ])
      if (!products || !rankings) return []
      const byId = new Map(products.map((p) => [p.id, p]))
      return rankings.leaderboard.flatMap((entry): TopEntry[] => {
        const product = byId.get(entry.productId)
        const value = metricValue(entry, metric)
        if (!product || value === null) return []
        if (options.ossOnly && product.type !== 'oss') return []
        return [{
          productId: entry.productId,
          name: product.name,
          vendor: product.vendor,
          type: product.type,
          arena: category.id,
          value,
          arenaScore: entry.aiEra,
        }]
      })
    }),
  )
  return perArena.flat().sort((a, b) => b.value - a.value).slice(0, capped)
}

export interface ResolvedStackSlot {
  role: string
  why: string
  kind: 'arena-top' | 'product' | 'editorial'
  arena: string | null
  productId: string | null
  productName: string | null
  metric: StackMetric | null
  metricValue: number | null
  rank: number | null
  note: string | null
  editorialUrl: string | null
}

export interface ResolvedStack {
  id: string
  name: string
  tagline: string
  audience: string
  slots: ResolvedStackSlot[]
}

// Mirrors lib/aiStacks.ts resolveStack (via mcp/src/tools.ts getStacks): "arena-top" picks
// resolve LIVE to the current #1 on the named metric, "product" picks are curated ids
// re-scored from their arena, "editorial" slots pass through labeled as such.
export async function getStacks(client: ArenaClient): Promise<ResolvedStack[]> {
  const stacks = await client.fetchJson<Stack[]>('/data/ai-stacks.json')

  const arenaIds = new Set<string>()
  for (const stack of stacks) {
    for (const slot of stack.slots) {
      if (slot.pick.kind !== 'editorial') arenaIds.add(slot.pick.arenaId)
    }
  }
  const arenaData = new Map(
    await Promise.all(
      [...arenaIds].map(async (arena) => {
        const [products, rankings] = await Promise.all([
          client.fetchJson<Product[]>(`/data/${arena}/products.json`).catch(() => null),
          client.fetchJson<Rankings>(`/data/${arena}/rankings.json`).catch(() => null),
        ])
        return [arena, products && rankings ? { products, rankings } : null] as const
      }),
    ),
  )

  return stacks.map((stack) => ({
    id: stack.id,
    name: stack.name,
    tagline: stack.tagline,
    audience: stack.audience,
    slots: stack.slots
      .map((slot): ResolvedStackSlot | null => {
        if (slot.pick.kind === 'editorial') {
          return {
            role: slot.role,
            why: slot.why,
            kind: 'editorial',
            arena: null,
            productId: null,
            productName: slot.pick.name,
            metric: null,
            metricValue: null,
            rank: null,
            note: slot.pick.note,
            editorialUrl: slot.pick.url,
          }
        }
        const data = arenaData.get(slot.pick.arenaId)
        if (!data) return null
        const metric: StackMetric = slot.pick.kind === 'product' ? (slot.pick.metric ?? 'agentReady') : slot.pick.metric
        const ossIds = new Set(data.products.filter((p) => p.type === 'oss').map((p) => p.id))
        const field = slot.pick.kind === 'arena-top' && slot.pick.ossOnly
          ? data.rankings.leaderboard.filter((e) => ossIds.has(e.productId))
          : data.rankings.leaderboard
        const ranked = [...field]
          .filter((e) => e[metric] !== null)
          .sort((a, b) => (b[metric] as number) - (a[metric] as number))
        const entry = slot.pick.kind === 'product'
          ? ranked.find((e) => e.productId === (slot.pick as { productId: string }).productId)
          : ranked[0]
        if (!entry) return null
        return {
          role: slot.role,
          why: slot.why,
          kind: slot.pick.kind,
          arena: slot.pick.arenaId,
          productId: entry.productId,
          productName: data.products.find((p) => p.id === entry.productId)?.name ?? entry.productId,
          metric,
          metricValue: entry[metric] as number,
          rank: ranked.indexOf(entry) + 1,
          note: slot.pick.kind === 'product' ? slot.pick.note : null,
          editorialUrl: null,
        }
      })
      .filter((slot): slot is ResolvedStackSlot => slot !== null),
  }))
}
