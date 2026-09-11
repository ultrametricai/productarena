import type { Category, Product, Story } from './schemas'

export type SearchEntryType = 'arena' | 'stack' | 'page' | 'product' | 'story'

export interface SearchEntry {
  type: SearchEntryType
  label: string
  sublabel: string
  href: string
  /** For product rows: render the product's committed logo in the palette. */
  productId?: string
  hasLogo?: boolean
  /** For arena rows: the arena's emoji from data/arena-icons.json. */
  icon?: string
  /**
   * Alias phrases people actually type ("agent harness", "vector store", "etl") that should
   * surface this entry — sourced from data/search-aliases.json and lowercased at build time
   * so the client never re-normalizes them per keystroke.
   */
  keywords?: string[]
}

// Structural subset of CategoryData — narrowed so this module (and its tests) don't need to
// depend on lib/data's full CategoryData shape (evidence/verdicts/rankings/stacks), which
// would otherwise force every test fixture to fabricate unrelated fields. Any CategoryData[]
// (e.g. loadAll()'s return value) satisfies this shape as-is.
export interface SearchIndexSource {
  category: Pick<Category, 'id' | 'name'>
  products: Pick<Product, 'id' | 'name'>[]
  stories: Pick<Story, 'id' | 'title' | 'theme'>[]
}

// Build-time index for the ⌘K command palette: one flat array covering every arena, product,
// and story across all populated categories. Story entries link to the arena page's matrix,
// anchored at that story's row (see the `id="story-{storyId}"` added to StoryMatrix rows) —
// there's no single-story page, so the matrix is the closest addressable location.
export function buildSearchIndex(
  sources: SearchIndexSource[],
  opts?: {
    arenaIcons?: Record<string, string>
    hasLogo?: (id: string) => boolean
    /** Arena id → alias phrases (data/search-aliases.json `arenas`). */
    keywords?: Record<string, string[]>
  },
): SearchEntry[] {
  const entries: SearchEntry[] = []

  for (const data of sources) {
    const aliases = opts?.keywords?.[data.category.id]
    entries.push({
      type: 'arena',
      label: data.category.name,
      sublabel: `${data.products.length} product${data.products.length === 1 ? '' : 's'}`,
      href: `/arena/${data.category.id}`,
      icon: opts?.arenaIcons?.[data.category.id],
      ...(aliases && aliases.length > 0 ? { keywords: aliases.map((k) => k.toLowerCase()) } : {}),
    })

    for (const p of data.products) {
      entries.push({
        type: 'product',
        label: p.name,
        sublabel: data.category.name,
        href: `/arena/${data.category.id}/product/${p.id}`,
        productId: p.id,
        hasLogo: opts?.hasLogo?.(p.id),
      })
    }

    // Story entries deliberately omitted — search focuses on arenas and products; stories are
    // discoverable inside each product/arena page where they have context.
  }

  return entries
}

// ---------------------------------------------------------------------------
// Auxiliary entries: curated stacks (/stacks#<id>) and key tool pages. Both take their alias
// phrases from data/search-aliases.json (`stacks` / `pages` sections), passed in by the caller
// so this module stays dependency-light for tests.
// ---------------------------------------------------------------------------

export interface StackSearchSource {
  id: string
  name: string
  tagline: string
}

export function buildStackEntries(stacks: StackSearchSource[], keywords?: Record<string, string[]>): SearchEntry[] {
  return stacks.map((s) => {
    const aliases = keywords?.[s.id]
    return {
      type: 'stack' as const,
      label: s.name,
      sublabel: s.tagline,
      href: `/stacks#${s.id}`,
      ...(aliases && aliases.length > 0 ? { keywords: aliases.map((k) => k.toLowerCase()) } : {}),
    }
  })
}

// The key tool pages worth surfacing in ⌘K. Labels/sublabels live here (they're UI copy, not
// data); alias phrases come from data/search-aliases.json `pages`, keyed by href.
const PAGE_DEFS: { href: string; label: string; sublabel: string }[] = [
  { href: '/global', label: 'Capability adoption', sublabel: 'MCP, llms.txt & more across the industry' },
  { href: '/compare', label: 'Compare', sublabel: 'Any products, side by side' },
  { href: '/certified', label: 'Certified Agent-Ready', sublabel: 'The certification registry' },
  { href: '/stacks', label: 'AI Stacks', sublabel: 'Curated cross-arena stacks' },
  { href: '/stacks/builder', label: 'Stack builder', sublabel: 'Build your own evidence-backed stack' },
]

export function buildPageEntries(keywords?: Record<string, string[]>): SearchEntry[] {
  return PAGE_DEFS.map((p) => {
    const aliases = keywords?.[p.href]
    return {
      type: 'page' as const,
      ...p,
      ...(aliases && aliases.length > 0 ? { keywords: aliases.map((k) => k.toLowerCase()) } : {}),
    }
  })
}

// ---------------------------------------------------------------------------
// Matching. The palette's filter lives here (not in CommandPalette) so it's unit-testable.
//
// Pipeline per keystroke:
//   1. lowercase + trim the query;
//   2. rank against label / keywords / sublabel with a naive trailing-'s' fold on both sides
//      ("agent harnesses" ↔ "agent harness", "vector stores" ↔ "vector store");
//   3. if nothing matched, strip classic query chrome — leading "best|top|great", trailing
//      "tools|software|apps|platforms" and "for startups" — and rank once more.
//
// Ranking tiers (lower wins): exact label, exact keyword, label substring, keyword substring,
// sublabel substring. Ties keep index order, so arenas stay in their curated order.
// ---------------------------------------------------------------------------

/** Naive singular fold: "harnesses"→"harness", "stores"→"store"; leaves "harness"/"os" alone. */
function singularizeWord(w: string): string {
  if (/(?:sses|shes|ches|xes|zes)$/.test(w)) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}

function foldPhrase(s: string): string {
  return s.split(/\s+/).map(singularizeWord).join(' ')
}

/** Strip "best X tools for startups"-style chrome; returns '' if nothing substantive remains. */
export function stripQueryChrome(q: string): string {
  let s = q
  let prev: string
  do {
    prev = s
    s = s.replace(/^(?:best|top|great)\s+/, '')
    s = s.replace(/\s+for\s+startups?$/, '')
    s = s.replace(/\s+(?:tools?|software|apps?|platforms?)$/, '')
  } while (s !== prev)
  return s.trim()
}

// Per-entry precomputed lowercase + folded haystacks so the per-keystroke work is pure
// substring checks. Built once per palette mount (see prepareSearchEntries), never per query.
export interface PreparedSearchEntry {
  entry: SearchEntry
  labelLc: string
  labelFolded: string
  sublabelLc: string
  sublabelFolded: string
  keywordsLc: string[]
  keywordsFolded: string[]
}

export function prepareSearchEntries(entries: SearchEntry[]): PreparedSearchEntry[] {
  return entries.map((entry) => {
    const labelLc = entry.label.toLowerCase()
    const sublabelLc = entry.sublabel.toLowerCase()
    const keywordsLc = (entry.keywords ?? []).map((k) => k.toLowerCase())
    return {
      entry,
      labelLc,
      labelFolded: foldPhrase(labelLc),
      sublabelLc,
      sublabelFolded: foldPhrase(sublabelLc),
      keywordsLc,
      keywordsFolded: keywordsLc.map(foldPhrase),
    }
  })
}

function scoreEntry(p: PreparedSearchEntry, q: string, fq: string): number | null {
  if (p.labelLc === q || p.labelFolded === fq) return 0
  if (p.keywordsLc.includes(q) || p.keywordsFolded.includes(fq)) return 1
  if (p.labelLc.includes(q) || p.labelFolded.includes(fq)) return 2
  if (p.keywordsLc.some((k) => k.includes(q)) || p.keywordsFolded.some((k) => k.includes(fq))) return 3
  if (p.sublabelLc.includes(q) || p.sublabelFolded.includes(fq)) return 4
  return null
}

function rank(prepared: PreparedSearchEntry[], q: string): SearchEntry[] {
  const fq = foldPhrase(q)
  const hits: { entry: SearchEntry; score: number; index: number }[] = []
  for (let i = 0; i < prepared.length; i++) {
    const score = scoreEntry(prepared[i], q, fq)
    if (score !== null) hits.push({ entry: prepared[i].entry, score, index: i })
  }
  hits.sort((a, b) => a.score - b.score || a.index - b.index)
  return hits.map((h) => h.entry)
}

/** The palette's filter: returns matching entries best-first ([] query → all, in index order). */
export function filterSearchEntries(prepared: PreparedSearchEntry[], query: string): SearchEntry[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ')
  if (q === '') return prepared.map((p) => p.entry)

  const direct = rank(prepared, q)
  if (direct.length > 0) return direct

  const stripped = stripQueryChrome(q)
  if (stripped !== '' && stripped !== q) return rank(prepared, stripped)
  return []
}
