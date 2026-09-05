import { describe, expect, it } from 'vitest'
import { ROLE_ALIASES, aliasesByArena, resolveRole } from '../aliases'

// The live arena ids as of writing (data/categories.json) — the resolver only ever commits to
// ids present in this list, so a stale alias can't produce a broken fetch.
const ARENA_IDS = [
  'desktop-os', 'startup-banking', 'project-management', 'web-scraping', 'mobile-dev',
  'code-hosting', 'ai-coding', 'edge-platforms', 'frontend-frameworks', 'local-llm-runtimes',
  'payroll', 'product-feedback', 'software-factory', 'mobile-payments', 'api-platforms',
  'team-chat', 'backend-as-a-service', 'payments', 'accounting', 'security-scanners',
  'infra-as-code', 'vibe-coding', 'model-gateways', 'llm-evals-observability', 'ai-search-apis',
  'agent-frameworks', 'agent-sandboxes', 'product-analytics', 'crm', 'legal-ops',
  'robotics-platforms', 'terminals', 'ai-assistants', 'ai-research-agents', 'package-managers',
  'vector-databases', 'auth-platforms', 'inference-providers',
]

describe('ROLE_ALIASES', () => {
  it('only points at arenas that exist in categories.json', () => {
    for (const [alias, arena] of Object.entries(ROLE_ALIASES)) {
      expect(ARENA_IDS, `alias "${alias}" -> "${arena}"`).toContain(arena)
    }
  })
})

describe('resolveRole', () => {
  it.each([
    ['banking', 'startup-banking'],
    ['payments', 'payments'],
    ['payroll', 'payroll'],
    ['accounting', 'accounting'],
    ['pm', 'project-management'],
    ['git', 'code-hosting'],
    ['coding-agent', 'ai-coding'],
    ['chat', 'team-chat'],
    ['baas', 'backend-as-a-service'],
    ['analytics', 'product-analytics'],
    ['crm', 'crm'],
    ['edge', 'edge-platforms'],
    ['auth', 'auth-platforms'],
    ['vector-db', 'vector-databases'],
    ['gateway', 'model-gateways'],
    ['terminal', 'terminals'],
  ])('maps the spec roles: %s -> %s', (role, arena) => {
    expect(resolveRole(role, ARENA_IDS).arena).toBe(arena)
  })

  it('accepts any live arena id verbatim', () => {
    for (const id of ARENA_IDS) expect(resolveRole(id, ARENA_IDS).arena).toBe(id)
  })

  it('normalizes case, whitespace, and underscores', () => {
    expect(resolveRole('  Vector_DB ', ARENA_IDS).arena).toBe('vector-databases')
    expect(resolveRole('CODING AGENT', ARENA_IDS).arena).toBe('ai-coding')
  })

  it('falls back to a unique substring match', () => {
    expect(resolveRole('robot', ARENA_IDS).arena).toBe('robotics-platforms')
    expect(resolveRole('scrap', ARENA_IDS).arena).toBe('web-scraping')
  })

  it('refuses ambiguous roles and suggests candidates instead', () => {
    const result = resolveRole('agent', ARENA_IDS)
    expect(result.arena).toBeNull()
    expect(result.suggestions).toContain('agent-frameworks')
    expect(result.suggestions).toContain('agent-sandboxes')
  })

  it('returns no arena and no suggestions for pure nonsense', () => {
    expect(resolveRole('zzzzz', ARENA_IDS)).toEqual({ arena: null, suggestions: [] })
    expect(resolveRole('   ', ARENA_IDS)).toEqual({ arena: null, suggestions: [] })
  })

  it('ignores aliases whose target arena is not live', () => {
    expect(resolveRole('banking', ['payments']).arena).toBeNull()
  })
})

describe('aliasesByArena', () => {
  it('groups aliases under live arenas only', () => {
    const grouped = aliasesByArena(['startup-banking'])
    expect(grouped).toHaveLength(1)
    const [arena, aliases] = grouped[0]
    expect(arena).toBe('startup-banking')
    expect(aliases).toEqual(expect.arrayContaining(['banking', 'bank']))
  })
})
