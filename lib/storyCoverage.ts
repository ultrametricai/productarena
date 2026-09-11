// Story → surface coverage, derived purely from committed data: which docs area / API section /
// community source the cited evidence behind each judged verdict actually came from. Evidence
// URLs cluster into a "surface" by (host + first meaningful path segment), so
// docs.stripe.com/terminal/... and docs.stripe.com/terminal.md are one "Terminal docs" surface
// while news.ycombinator.com threads collapse into one "Hacker News" surface. No LLM, no new
// crawls — everything here restates what verdicts.json already cites.
//
// Pure and node:fs-free (imports only lib/data-helpers + lib/schemas types), so both the client
// StoryVerdictsTable ("Covered by" chips) and the server product page / llms.md renderers can
// use it — the same split rule as lib/storyVerdictsSort.ts.

import { type CategoryData, evidenceById, verdictFor } from './data-helpers'
import type { Evidence, Verdict } from './schemas'

// One evidence surface as cited by one story's verdict: `key` is the stable cluster id
// (host[/segment], or a curated key for community/github hosts), `url` the representative
// evidence URL (the strongest-tier citation on this surface), `tier` the strongest tier seen.
export interface CoverageSurface {
  key: string
  label: string
  url: string
  tier: Evidence['tier']
}

export interface StoryCoverage {
  storyId: string
  surfaces: CoverageSurface[]
}

// The inverse view: one surface with every story it covers (story ids in taxonomy order).
export interface SurfaceCoverage extends CoverageSurface {
  storyIds: string[]
}

// Same strength ladder as lib/verification.ts's EVIDENCE_LADDER: a hands-on probe outranks
// repo code, which outranks community reports, which outrank the vendor's own docs.
const TIER_RANK: Record<Evidence['tier'], number> = {
  probe: 3,
  github: 2,
  community: 1,
  'claimed-docs': 0,
}

// Hosts whose surfaces are the host itself, not a path area — GitHub blobs/raw READMEs are one
// "GitHub README" surface regardless of org/repo path, and the community aggregators collapse
// per site (an HN item URL and an hn.algolia search hit are both "Hacker News").
const HOST_SURFACES: Record<string, { key: string; label: string }> = {
  'github.com': { key: 'github', label: 'GitHub README' },
  'raw.githubusercontent.com': { key: 'github', label: 'GitHub README' },
  'gist.github.com': { key: 'github', label: 'GitHub README' },
  'news.ycombinator.com': { key: 'hacker-news', label: 'Hacker News' },
  'hn.algolia.com': { key: 'hacker-news', label: 'Hacker News' },
  'reddit.com': { key: 'reddit', label: 'Reddit' },
  'old.reddit.com': { key: 'reddit', label: 'Reddit' },
  'stackoverflow.com': { key: 'stack-overflow', label: 'Stack Overflow' },
  'x.com': { key: 'x-twitter', label: 'X (Twitter)' },
  'twitter.com': { key: 'x-twitter', label: 'X (Twitter)' },
}

// Curated pretty names for common first path segments — everything else falls through to the
// humanized "<Segment> docs" default below.
const SEGMENT_LABELS: Record<string, string> = {
  api: 'API reference',
  'api-reference': 'API reference',
  reference: 'API reference',
  docs: 'docs',
  'llms.txt': 'llms.txt',
  'openapi.json': 'OpenAPI spec',
  mcp: 'MCP docs',
  cli: 'CLI docs',
}

// Tokens that read as acronyms/initialisms in a surface label ("stripe-cli" → "Stripe CLI docs").
const ACRONYMS = new Set(['api', 'cli', 'mcp', 'sdk', 'ai', 'imap', 'smtp', 'sso', 'scim', 'oauth'])

function humanizeSegment(segment: string): string {
  return segment
    .split('-')
    .map((token, i) => {
      if (ACRONYMS.has(token)) return token.toUpperCase()
      return i === 0 ? token.charAt(0).toUpperCase() + token.slice(1) : token
    })
    .join(' ')
}

// The first path segment with crawl-artifact extensions stripped — docs.stripe.com/billing.md
// and docs.stripe.com/billing/... are the same "Billing docs" surface. The agent-surface
// filenames llms.txt / openapi.json are kept verbatim: the extension IS the surface.
function firstSegment(pathname: string): string {
  const raw = pathname.split('/').find((part) => part !== '') ?? ''
  const lower = raw.toLowerCase()
  if (lower in SEGMENT_LABELS) return lower
  return lower.replace(/\.(md|mdx|txt|json|html)$/, '')
}

// (key, label) for one evidence URL. Exported for tests; display code should go through
// surfacesForEvidence / coverageMapFor, which also resolve tiers and representative URLs.
export function surfaceForUrl(url: string): { key: string; label: string } {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    // EvidenceSchema enforces valid URLs, so this is purely defensive for test fixtures.
    return { key: url, label: url }
  }
  const host = parsed.host.replace(/^www\./, '')
  const curated = HOST_SURFACES[host]
  if (curated) return curated
  const segment = firstSegment(parsed.pathname)
  if (segment === '') return { key: host, label: host }
  const label = SEGMENT_LABELS[segment] ?? `${humanizeSegment(segment)} docs`
  return { key: `${host}/${segment}`, label }
}

// A verdict "covers" its story only when the judge found something — full/partial/disputed.
// none/na cite absence-evidence (or nothing at all): the surfaces they mention did NOT cover
// the story, so they're excluded rather than counted.
export function isCoveredVerdict(verdict: Verdict['verdict']): boolean {
  return verdict === 'full' || verdict === 'partial' || verdict === 'disputed'
}

// Clusters one story's cited evidence into deduped surfaces: strongest tier wins per surface
// (and contributes the representative URL), ordered strongest-tier-first then first-cited.
export function surfacesForEvidence(items: Array<Pick<Evidence, 'tier' | 'url'>>): CoverageSurface[] {
  const byKey = new Map<string, CoverageSurface & { order: number }>()
  items.forEach((item, order) => {
    const { key, label } = surfaceForUrl(item.url)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, { key, label, url: item.url, tier: item.tier, order })
    } else if (TIER_RANK[item.tier] > TIER_RANK[existing.tier]) {
      existing.tier = item.tier
      existing.url = item.url
    }
  })
  return [...byKey.values()]
    .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier] || a.order - b.order)
    .map(({ key, label, url, tier }) => ({ key, label, url, tier }))
}

// Per-story view: every covered (full/partial/disputed) story for one product with the
// surfaces its cited evidence came from, in taxonomy story order. Stories whose verdicts are
// none/na are honestly absent — no coverage is not a surface.
export function storyCoverageFor(data: CategoryData, productId: string): StoryCoverage[] {
  const evidence = evidenceById(data)
  return data.stories.flatMap((s) => {
    const v = verdictFor(data, productId, s.id)
    if (!isCoveredVerdict(v.verdict)) return []
    const items = v.evidenceIds
      .map((id) => evidence.get(id))
      .filter((e): e is Evidence => e !== undefined)
    const surfaces = surfacesForEvidence(items)
    if (surfaces.length === 0) return []
    return [{ storyId: s.id, surfaces }]
  })
}

// The inverse view for the product page's "Coverage map" section and llms.md: each surface with
// every story it covers, most-covering first (ties: stronger tier, then label A→Z). A reader
// sees at a glance that e.g. the API reference alone carries 14 stories while the agent docs
// carry 6.
export function coverageMapFor(data: CategoryData, productId: string): SurfaceCoverage[] {
  const bySurface = new Map<string, SurfaceCoverage>()
  for (const { storyId, surfaces } of storyCoverageFor(data, productId)) {
    for (const s of surfaces) {
      const existing = bySurface.get(s.key)
      if (!existing) {
        bySurface.set(s.key, { ...s, storyIds: [storyId] })
      } else {
        existing.storyIds.push(storyId)
        if (TIER_RANK[s.tier] > TIER_RANK[existing.tier]) {
          existing.tier = s.tier
          existing.url = s.url
        }
      }
    }
  }
  return [...bySurface.values()].sort(
    (a, b) =>
      b.storyIds.length - a.storyIds.length ||
      TIER_RANK[b.tier] - TIER_RANK[a.tier] ||
      a.label.localeCompare(b.label),
  )
}
