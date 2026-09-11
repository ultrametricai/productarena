import { describe, expect, it } from 'vitest'
import searchAliases from '@/data/search-aliases.json'
import categories from '@/data/categories.json'
import aiStacks from '@/data/ai-stacks.json'
import {
  buildPageEntries,
  buildSearchIndex,
  buildStackEntries,
  filterSearchEntries,
  prepareSearchEntries,
  stripQueryChrome,
  type SearchEntry,
  type SearchIndexSource,
} from '@/lib/search-index'

const arenaAliases = searchAliases.arenas as Record<string, string[]>
const stackAliases = searchAliases.stacks as Record<string, string[]>
const pageAliases = searchAliases.pages as Record<string, string[]>

// A miniature but REAL slice of the index: actual arena ids/names from data/categories.json,
// actual aliases from data/search-aliases.json — so these tests break when the alias data does.
function realArenaSource(id: string): SearchIndexSource {
  const cat = (categories as { id: string; name: string }[]).find((c) => c.id === id)
  if (!cat) throw new Error(`arena ${id} missing from data/categories.json`)
  return { category: { id: cat.id, name: cat.name }, products: [], stories: [] }
}

const fixtureArenas = [
  'agent-frameworks',
  'vector-databases',
  'data-pipelines',
  'mcp-infrastructure',
  'ai-coding',
  'observability',
  'model-gateways',
  'customer-data-platforms',
  'browser-agents',
  'feature-flags',
]

const entries: SearchEntry[] = [
  ...buildSearchIndex(fixtureArenas.map(realArenaSource), { keywords: arenaAliases }),
  ...buildStackEntries(
    (aiStacks as { id: string; name: string; tagline: string }[]).map(({ id, name, tagline }) => ({ id, name, tagline })),
    stackAliases,
  ),
  ...buildPageEntries(pageAliases),
]
const prepared = prepareSearchEntries(entries)

function firstHref(query: string): string | undefined {
  return filterSearchEntries(prepared, query)[0]?.href
}

describe('search-aliases.json integrity', () => {
  const arenaIds = new Set((categories as { id: string }[]).map((c) => c.id))
  const stackIds = new Set((aiStacks as { id: string }[]).map((s) => s.id))

  it('covers EVERY arena with 3-8 alias phrases', () => {
    for (const id of arenaIds) {
      const aliases = arenaAliases[id]
      expect(aliases, `arena ${id} has no aliases`).toBeDefined()
      expect(aliases.length, `arena ${id} has ${aliases?.length} aliases (want 3-8)`).toBeGreaterThanOrEqual(3)
      expect(aliases.length, `arena ${id} has ${aliases?.length} aliases (want 3-8)`).toBeLessThanOrEqual(8)
    }
  })

  it('has no alias keys pointing at nonexistent arenas or stacks', () => {
    for (const id of Object.keys(arenaAliases)) expect(arenaIds.has(id), `unknown arena id ${id}`).toBe(true)
    for (const id of Object.keys(stackAliases)) expect(stackIds.has(id), `unknown stack id ${id}`).toBe(true)
  })

  it('covers every stack', () => {
    for (const id of stackIds) expect(stackAliases[id], `stack ${id} has no aliases`).toBeDefined()
  })

  it('keeps alias phrases free of matcher-stripped chrome (best/top prefixes, tools/software suffixes)', () => {
    for (const [id, aliases] of Object.entries(arenaAliases)) {
      for (const a of aliases) {
        expect(a, `alias "${a}" (${id}) should not start with best/top/great`).not.toMatch(/^(?:best|top|great)\s/)
        expect(a, `alias "${a}" (${id}) should be lowercase`).toBe(a.toLowerCase())
      }
    }
  })
})

describe('stripQueryChrome', () => {
  it('strips leading best/top/great and trailing tools/software/apps/platforms/for startups', () => {
    expect(stripQueryChrome('best etl tools for startups')).toBe('etl')
    expect(stripQueryChrome('top llm gateways')).toBe('llm gateways')
    expect(stripQueryChrome('great monitoring software')).toBe('monitoring')
    expect(stripQueryChrome('feature flag platforms')).toBe('feature flag')
  })

  it('leaves ordinary queries untouched', () => {
    expect(stripQueryChrome('vector store')).toBe('vector store')
  })
})

describe('filterSearchEntries — the classic queries', () => {
  it('"best agent harnesses" lands on the Agent Frameworks arena first', () => {
    expect(firstHref('best agent harnesses')).toBe('/arena/agent-frameworks')
  })

  it('"vector store" lands on Vector Databases', () => {
    expect(firstHref('vector store')).toBe('/arena/vector-databases')
  })

  it('"etl" lands on Data Pipelines', () => {
    expect(firstHref('etl')).toBe('/arena/data-pipelines')
  })

  it('"mcp adoption" lands on /global', () => {
    expect(firstHref('mcp adoption')).toBe('/global')
  })

  it('more synonym forms: agent sdk, ai ide, uptime monitoring, cdp, browser automation, llm gateway', () => {
    expect(firstHref('agent sdk')).toBe('/arena/agent-frameworks')
    expect(firstHref('ai ide')).toBe('/arena/ai-coding')
    expect(firstHref('uptime monitoring')).toBe('/arena/observability')
    expect(firstHref('cdp')).toBe('/arena/customer-data-platforms')
    expect(firstHref('browser automation')).toBe('/arena/browser-agents')
    expect(firstHref('best llm gateway')).toBe('/arena/model-gateways')
  })

  it('is plural/singular tolerant both ways', () => {
    expect(firstHref('agent harness')).toBe('/arena/agent-frameworks')
    expect(firstHref('vector stores')).toBe('/arena/vector-databases')
    expect(firstHref('feature flag')).toBe('/arena/feature-flags')
  })

  it('stack aliases resolve to the stack anchor', () => {
    expect(firstHref('local llm stack')).toBe('/stacks#local-sovereign')
  })

  it('page aliases resolve: compare products, certified agent ready, my stack', () => {
    expect(firstHref('compare products')).toBe('/compare')
    expect(firstHref('certified agent ready')).toBe('/certified')
    expect(firstHref('my stack')).toBe('/my-stack')
  })

  it('empty query returns every entry in index order', () => {
    expect(filterSearchEntries(prepared, '')).toEqual(entries)
    expect(filterSearchEntries(prepared, '   ')).toEqual(entries)
  })

  it('still returns nothing for genuine misses', () => {
    expect(filterSearchEntries(prepared, 'zzzzz no such thing')).toEqual([])
  })
})

describe('ranking sanity', () => {
  it('an exact label match beats a keyword match, regardless of index order', () => {
    const synthetic = prepareSearchEntries([
      { type: 'arena', label: 'Other Arena', sublabel: '', href: '/arena/other', keywords: ['vector store'] },
      { type: 'arena', label: 'Vector Store', sublabel: '', href: '/arena/exact' },
    ])
    const results = filterSearchEntries(synthetic, 'vector store')
    expect(results.map((e) => e.href)).toEqual(['/arena/exact', '/arena/other'])
  })

  it('a label substring match outranks a sublabel substring match', () => {
    const synthetic = prepareSearchEntries([
      { type: 'product', label: 'Prod', sublabel: 'Vector Databases & Memory Stores', href: '/p' },
      { type: 'arena', label: 'Vector Databases & Memory Stores', sublabel: '5 products', href: '/a' },
    ])
    const results = filterSearchEntries(synthetic, 'vector databases')
    expect(results.map((e) => e.href)).toEqual(['/a', '/p'])
  })
})
