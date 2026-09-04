// Pure request-routing/formatting logic for each MCP tool, factored out of mcp/src/server.ts
// so it's testable without spinning up an MCP transport — each function takes an
// ArenaClient and returns plain data; mcp/src/server.ts just wraps these in
// registerTool() calls and formats the result as tool content.
//
// The Cloudflare worker's remote MCP endpoint (infra/cloudflare-proxy/worker.js) hand-rolls
// the same eight tools in dependency-free JS — keep the two in sync if tool shapes change.
import type { ArenaClient } from './client.js'
import type { Category, Evidence, Product, Rankings, Stack, StackMetric, Story, Verdict } from './types.js'

// Thrown for caller mistakes (unknown arena/product/story ids, bad metric names) — the MCP
// layer reports these as normal tool-error results instead of crashing the connection.
export class ArenaError extends Error {}

async function fetchCategories(client: ArenaClient): Promise<Category[]> {
  return client.fetchJson<Category[]>('/data/categories.json')
}

async function assertKnownArena(client: ArenaClient, arena: string): Promise<void> {
  const categories = await fetchCategories(client)
  if (!categories.some((c) => c.id === arena)) {
    throw new ArenaError(`unknown arena "${arena}" — see list_arenas for valid ids`)
  }
}

export async function listArenas(client: ArenaClient): Promise<Category[]> {
  return fetchCategories(client)
}

export async function getRankings(client: ArenaClient, arena: string): Promise<Rankings> {
  await assertKnownArena(client, arena)
  return client.fetchJson<Rankings>(`/data/${arena}/rankings.json`)
}

export interface VerdictSummary {
  storyId: string
  storyTitle: string | null
  verdict: Verdict['verdict']
  quality: number
  confidence: Verdict['confidence']
}

export interface ProductDetail {
  arena: string
  product: Product
  ranking: (Rankings['leaderboard'][number] & { rank: number }) | null
  verdictCounts: Record<Verdict['verdict'], number>
  // One summary row per judged story — for the full rationale + cited evidence URLs of any
  // single cell, call get_verdict(arena, product, story).
  verdicts: VerdictSummary[]
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
    throw new ArenaError(`unknown product "${productId}" in arena "${arena}" — see get_rankings or search_products`)
  }

  const storyTitleById = new Map(stories.map((s) => [s.id, s.title]))
  const verdictCounts: Record<Verdict['verdict'], number> = { full: 0, partial: 0, none: 0, disputed: 0, na: 0 }
  const summaries: VerdictSummary[] = verdicts
    .filter((v) => v.productId === productId)
    .map((v) => {
      verdictCounts[v.verdict] += 1
      return {
        storyId: v.storyId,
        storyTitle: storyTitleById.get(v.storyId) ?? null,
        verdict: v.verdict,
        quality: v.quality,
        confidence: v.confidence,
      }
    })

  const index = rankings.leaderboard.findIndex((e) => e.productId === productId)
  const ranking = index === -1 ? null : { ...rankings.leaderboard[index], rank: index + 1 }

  return { arena, product, ranking, verdictCounts, verdicts: summaries }
}

export interface VerdictDetail {
  arena: string
  productId: string
  productName: string | null
  storyId: string
  storyTitle: string | null
  storyWeight: number | null
  verdict: Verdict['verdict']
  quality: number
  confidence: Verdict['confidence']
  rationale: string
  evidence: Array<{ id: string; tier: Evidence['tier']; url: string }>
}

export async function getVerdict(client: ArenaClient, arena: string, productId: string, storyId: string): Promise<VerdictDetail> {
  await assertKnownArena(client, arena)
  const [products, stories, verdicts, evidence] = await Promise.all([
    client.fetchJson<Product[]>(`/data/${arena}/products.json`),
    client.fetchJson<Story[]>(`/data/${arena}/stories.json`),
    client.fetchJson<Verdict[]>(`/data/${arena}/verdicts.json`),
    client.fetchJson<Evidence[]>(`/data/${arena}/evidence/${productId}.json`).catch(() => [] as Evidence[]),
  ])

  const product = products.find((p) => p.id === productId)
  if (!product) {
    throw new ArenaError(`unknown product "${productId}" in arena "${arena}" — see get_rankings or search_products`)
  }
  const story = stories.find((s) => s.id === storyId)
  if (!story) {
    throw new ArenaError(`unknown story "${storyId}" in arena "${arena}" — see get_product's verdicts for valid story ids`)
  }
  const verdict = verdicts.find((v) => v.productId === productId && v.storyId === storyId)
  if (!verdict) {
    throw new ArenaError(`no verdict for product "${productId}" on story "${storyId}" in arena "${arena}"`)
  }

  const evidenceById = new Map(evidence.map((e) => [e.id, e]))
  return {
    arena,
    productId,
    productName: product.name,
    storyId,
    storyTitle: story.title,
    storyWeight: story.weight ?? null,
    verdict: verdict.verdict,
    quality: verdict.quality,
    confidence: verdict.confidence,
    rationale: verdict.rationale,
    evidence: verdict.evidenceIds
      .map((id) => evidenceById.get(id))
      .filter((e): e is Evidence => Boolean(e))
      .map((e) => ({ id: e.id, tier: e.tier, url: e.url })),
  }
}

export interface SearchResult {
  arena: string
  product: Product
}

// Fetches every category's products.json and filters by a case-insensitive substring match
// against id, name, or vendor. Deliberately simple (no ranking/fuzzy match) — this is meant
// for an agent to locate the right (arena, product) pair to feed into get_product, not
// as a general search engine.
export async function searchProducts(client: ArenaClient, query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const index = await productIndex(client)
  const results: SearchResult[] = []
  for (const { arena, product } of index) {
    if (
      product.id.toLowerCase().includes(q) ||
      product.name.toLowerCase().includes(q) ||
      product.vendor.toLowerCase().includes(q)
    ) {
      results.push({ arena, product })
    }
  }
  return results
}

interface IndexedProduct {
  arena: string
  product: Product
}

// Flat (arena, product) index across every category. The client's TTL cache makes repeated
// calls cheap — each underlying products.json is fetched at most once per TTL window.
async function productIndex(client: ArenaClient): Promise<IndexedProduct[]> {
  const categories = await fetchCategories(client)
  const perArena = await Promise.all(
    categories.map(async (category) => {
      const products = await client.fetchJson<Product[]>(`/data/${category.id}/products.json`)
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

// Cross-arena comparison: product ids are globally unique across ProductArena, so each id is
// located via the flat product index, then scored from its own arena's leaderboard. Scores are
// comparable in spirit (same scoring formula everywhere) but each arena has its own story set —
// hence the note in the result.
export async function compare(client: ArenaClient, productIds: string[]): Promise<CompareResult> {
  const ids = [...new Set(productIds.map((p) => p.trim().toLowerCase()).filter(Boolean))]
  if (ids.length === 0) {
    throw new ArenaError('compare requires at least one product id — see search_products to find ids')
  }
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
    note:
      'Scores use the same formula everywhere, but each arena judges its own story set — cross-arena numbers are indicative, not a strict total ordering. Products in the same arena are directly comparable (see get_rankings for their head-to-head battles).',
  }
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

// Mirrors lib/aiStacks.ts's resolveStack: "arena-top" picks resolve LIVE to the current #1 of
// that arena on the named metric (optionally restricted to OSS products), "product" picks are
// curated ids re-scored from their arena, "editorial" slots pass through labeled as such.
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
            productName: null,
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

export const TOP_METRICS = ['score', 'arenaScore', 'agentReady', 'agenticApp', 'apiQuality'] as const
export type TopMetric = (typeof TOP_METRICS)[number]

export interface TopProductEntry {
  productId: string
  name: string
  vendor: string
  arena: string
  metric: TopMetric
  value: number
  score: number
  arenaScore: number | null
}

const TOP_LIMIT_DEFAULT = 10
const TOP_LIMIT_MAX = 50

// Flattens every arena's leaderboard into one list and ranks it by the chosen metric.
// "arenaScore" maps to the data files' `aiEra` field (the Arena Score, formerly AI-Era Index).
export async function topProducts(client: ArenaClient, metric: string, limit?: number): Promise<TopProductEntry[]> {
  const normalized = metric === 'aiEra' ? 'arenaScore' : metric
  if (!TOP_METRICS.includes(normalized as TopMetric)) {
    throw new ArenaError(`unknown metric "${metric}" — use one of: ${TOP_METRICS.join(', ')}`)
  }
  const field: 'score' | 'aiEra' | 'agentReady' | 'agenticApp' | 'apiQuality' =
    normalized === 'arenaScore' ? 'aiEra' : (normalized as Exclude<TopMetric, 'arenaScore'>)
  const capped = Math.max(1, Math.min(Math.floor(limit ?? TOP_LIMIT_DEFAULT), TOP_LIMIT_MAX))

  const categories = await fetchCategories(client)
  const perArena = await Promise.all(
    categories.map(async (category) => {
      const [products, rankings] = await Promise.all([
        client.fetchJson<Product[]>(`/data/${category.id}/products.json`).catch(() => null),
        client.fetchJson<Rankings>(`/data/${category.id}/rankings.json`).catch(() => null),
      ])
      if (!products || !rankings) return []
      const nameOf = new Map(products.map((p) => [p.id, p]))
      return rankings.leaderboard
        .filter((e) => e[field] !== null)
        .map((e) => ({
          productId: e.productId,
          name: nameOf.get(e.productId)?.name ?? e.productId,
          vendor: nameOf.get(e.productId)?.vendor ?? '',
          arena: category.id,
          metric: normalized as TopMetric,
          value: e[field] as number,
          score: e.score,
          arenaScore: e.aiEra,
        }))
    }),
  )

  return perArena
    .flat()
    .sort((a, b) => b.value - a.value)
    .slice(0, capped)
}
