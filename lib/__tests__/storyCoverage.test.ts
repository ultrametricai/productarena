import { describe, expect, it } from 'vitest'
import type { CategoryData } from '@/lib/data'
import type { Category, Evidence, Product, Story, Verdict } from '@/lib/schemas'
import {
  coverageMapFor,
  isCoveredVerdict,
  storyCoverageFor,
  surfaceForUrl,
  surfacesForEvidence,
} from '@/lib/storyCoverage'

const category: Category = { id: 'cat', name: 'Cat', description: 'd', personas: ['dev'] }
const products: Product[] = [{ id: 'p', name: 'P', vendor: 'v', type: 'oss', urls: { site: 'https://p.example' } }]
const stories: Story[] = [
  { id: 's1', persona: 'dev', title: 'As a dev, I take a payment', theme: 'core', group: 'g', weight: 1 },
  { id: 's2', persona: 'dev', title: 'As a dev, I refund a payment', theme: 'core', group: 'g', weight: 1 },
  { id: 's3', persona: 'dev', title: 'As a dev, I do something unsupported', theme: 'core', group: 'g', weight: 1 },
  { id: 's4', persona: 'dev', title: 'As a dev, I do something inapplicable', theme: 'core', group: 'g', weight: 1 },
]

const ev = (id: string, tier: Evidence['tier'], url: string): Evidence => ({
  id, tier, url, excerpt: 'x', fetchedAt: '2026-08-27T00:00:00.000Z',
})

const verdict = (storyId: string, over: Partial<Verdict>): Verdict => ({
  productId: 'p', storyId, verdict: 'full', quality: 8, confidence: 'high', rationale: 'r', evidenceIds: [], ...over,
})

function makeData(): CategoryData {
  return {
    category,
    products,
    stories,
    evidence: {
      p: [
        ev('docs-1', 'claimed-docs', 'https://docs.p.example/payments.md'),
        ev('docs-2', 'claimed-docs', 'https://docs.p.example/payments/cards'),
        ev('docs-3', 'claimed-docs', 'https://docs.p.example/refunds.md'),
        ev('api-1', 'claimed-docs', 'https://docs.p.example/api/charges'),
        ev('probe-1', 'probe', 'https://docs.p.example/payments.md'),
        ev('gh-1', 'github', 'https://github.com/p/p'),
        ev('comm-1', 'community', 'https://news.ycombinator.com/item?id=1'),
        ev('comm-2', 'community', 'https://hn.algolia.com/api/v1/search?query=p'),
      ],
    },
    verdicts: [
      // Two surfaces (Payments docs upgraded to probe by probe-1, API reference) — the docs.md
      // and docs path variants must cluster into ONE surface.
      verdict('s1', { evidenceIds: ['docs-1', 'docs-2', 'api-1', 'probe-1'] }),
      // Partial with github + both HN hosts (which must collapse into one Hacker News surface).
      verdict('s2', { verdict: 'partial', quality: 5, evidenceIds: ['docs-3', 'gh-1', 'comm-1', 'comm-2'] }),
      // Evidenced none: the citations are absence-evidence, so NO coverage may be derived.
      verdict('s3', { verdict: 'none', quality: 0, evidenceIds: ['docs-1'] }),
      verdict('s4', { verdict: 'na', quality: 0, evidenceIds: [] }),
    ],
    rankings: { generatedAt: '2026-08-27T00:00:00.000Z', leaderboard: [], battles: [] },
    stacks: [],
    popularity: {},
    claims: {},
    uncertainty: [],
    vendorResponses: [],
    certifications: [],
  }
}

describe('surfaceForUrl', () => {
  it('clusters by host + first path segment, stripping crawl extensions', () => {
    expect(surfaceForUrl('https://docs.stripe.com/terminal')).toEqual({ key: 'docs.stripe.com/terminal', label: 'Terminal docs' })
    expect(surfaceForUrl('https://docs.stripe.com/billing.md')).toEqual(surfaceForUrl('https://docs.stripe.com/billing/subscriptions'))
    expect(surfaceForUrl('https://www.p.example/pricing').key).toBe('p.example/pricing')
  })

  it('prettifies curated segments: API reference, llms.txt, OpenAPI spec, MCP/CLI docs', () => {
    expect(surfaceForUrl('https://docs.stripe.com/api/charges').label).toBe('API reference')
    expect(surfaceForUrl('https://docs.p.example/llms.txt').label).toBe('llms.txt')
    expect(surfaceForUrl('https://docs.p.example/openapi.json').label).toBe('OpenAPI spec')
    expect(surfaceForUrl('https://docs.stripe.com/mcp.md').label).toBe('MCP docs')
    // llms.txt keeps its extension (the extension IS the surface) — distinct from the .md strip.
    expect(surfaceForUrl('https://docs.p.example/llms.txt').key).toBe('docs.p.example/llms.txt')
  })

  it('uppercases acronym tokens in default labels', () => {
    expect(surfaceForUrl('https://docs.stripe.com/stripe-cli.md').label).toBe('Stripe CLI docs')
  })

  it('collapses community and github hosts to one curated surface each', () => {
    expect(surfaceForUrl('https://news.ycombinator.com/item?id=1')).toEqual(surfaceForUrl('https://hn.algolia.com/api/v1/search?q=x'))
    expect(surfaceForUrl('https://github.com/p/p')).toEqual(surfaceForUrl('https://raw.githubusercontent.com/p/p/main/README.md'))
    expect(surfaceForUrl('https://github.com/p/p').label).toBe('GitHub README')
  })

  it('labels a bare host (no path) as the host itself', () => {
    expect(surfaceForUrl('https://p.example/')).toEqual({ key: 'p.example', label: 'p.example' })
  })
})

describe('surfacesForEvidence', () => {
  it('dedupes by surface, keeping the strongest tier and its URL, strongest first', () => {
    const surfaces = surfacesForEvidence([
      { tier: 'claimed-docs', url: 'https://docs.p.example/payments.md' },
      { tier: 'probe', url: 'https://docs.p.example/payments/probe' },
      { tier: 'claimed-docs', url: 'https://docs.p.example/api/charges' },
    ])
    expect(surfaces).toEqual([
      { key: 'docs.p.example/payments', label: 'Payments docs', url: 'https://docs.p.example/payments/probe', tier: 'probe' },
      { key: 'docs.p.example/api', label: 'API reference', url: 'https://docs.p.example/api/charges', tier: 'claimed-docs' },
    ])
  })
})

describe('isCoveredVerdict', () => {
  it('covers full/partial/disputed, never none/na', () => {
    expect(isCoveredVerdict('full')).toBe(true)
    expect(isCoveredVerdict('partial')).toBe(true)
    expect(isCoveredVerdict('disputed')).toBe(true)
    expect(isCoveredVerdict('none')).toBe(false)
    expect(isCoveredVerdict('na')).toBe(false)
  })
})

describe('storyCoverageFor', () => {
  it('maps each covered story to its evidence surfaces and excludes none/na cells', () => {
    const coverage = storyCoverageFor(makeData(), 'p')
    expect(coverage.map((c) => c.storyId)).toEqual(['s1', 's2'])
    const s1 = coverage[0]
    // payments.md + payments/cards + probe collapse into one probe-tier Payments surface.
    expect(s1.surfaces).toEqual([
      { key: 'docs.p.example/payments', label: 'Payments docs', url: 'https://docs.p.example/payments.md', tier: 'probe' },
      { key: 'docs.p.example/api', label: 'API reference', url: 'https://docs.p.example/api/charges', tier: 'claimed-docs' },
    ])
    const s2 = coverage[1]
    expect(s2.surfaces.map((s) => s.key)).toEqual(['github', 'hacker-news', 'docs.p.example/refunds'])
  })
})

describe('coverageMapFor', () => {
  it('inverts to surface → stories, most-covering first', () => {
    const map = coverageMapFor(makeData(), 'p')
    expect(map.map((s) => [s.key, s.storyIds])).toEqual([
      // Ties on count break by tier strength (probe > github > community > claimed-docs).
      ['docs.p.example/payments', ['s1']],
      ['github', ['s2']],
      ['hacker-news', ['s2']],
      ['docs.p.example/api', ['s1']],
      ['docs.p.example/refunds', ['s2']],
    ])
  })

  it('returns [] when every verdict is none/na', () => {
    const data = makeData()
    data.verdicts = data.verdicts.map((v) => ({ ...v, verdict: 'none' as const, quality: 0 }))
    expect(coverageMapFor(data, 'p')).toEqual([])
  })
})
