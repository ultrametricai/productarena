import { describe, expect, it } from 'vitest'
import {
  LAWS_MAX,
  LAWS_MIN,
  loadResourceRegistry,
  loadStartupLawsMarkdown,
  parseStartupLaws,
  validateResourceRegistry,
  validateResources,
  validateStartupLaws,
  type ResourceRegistry,
} from '@/lib/resources'

// The startup-resources corpus gates: the committed registry and LAWS.md must satisfy every
// structural and referential invariant (unique ids, HTTPS URLs, dated checks, every law
// citation resolving to a registry record). Deterministic — liveness checks are editorial,
// recorded via checked_on (see resources/README.md).

const AS_OF = new Date('2026-09-29T00:00:00Z')

describe('resources corpus', () => {
  it('the committed registry + LAWS.md pass every invariant', () => {
    expect(validateResources(AS_OF)).toEqual([])
  })

  it('holds the curated canon: PG essays, YC library/documents, and government primary sources', () => {
    const registry = loadResourceRegistry()
    const ids = new Set(registry.resources.map((r) => r.id))
    expect(registry.resources.length).toBeGreaterThanOrEqual(30)
    for (const id of ['pg-do-things-that-dont-scale', 'pg-default-alive', 'yc-documents', 'irs-form-15620', 'de-franchise-tax', 'nvca-model-docs']) {
      expect(ids.has(id), `registry must keep ${id}`).toBe(true)
    }
    // Government records are marked primary-source, matching the sources/ doctrine.
    for (const r of registry.resources) {
      if (r.url.includes('.gov/')) expect(r.kind, `${r.id} is a government record`).toBe('primary-source')
    }
  })

  it(`distils ${LAWS_MIN}-${LAWS_MAX} laws, each grouped under a lifecycle stage with resolving citations`, () => {
    const { laws, errors } = parseStartupLaws(loadStartupLawsMarkdown())
    expect(errors).toEqual([])
    expect(laws.length).toBeGreaterThanOrEqual(LAWS_MIN)
    expect(laws.length).toBeLessThanOrEqual(LAWS_MAX)
    const ids = new Set(loadResourceRegistry().resources.map((r) => r.id))
    for (const law of laws) {
      expect(law.stage.length, `law ${law.number} needs a stage`).toBeGreaterThan(0)
      expect(law.sourceIds.length, `law ${law.number} needs citations`).toBeGreaterThan(0)
      for (const id of law.sourceIds) expect(ids.has(id), `law ${law.number} cites unknown ${id}`).toBe(true)
    }
    // The aphorisms keep their attribution: the two headline laws cite their actual origins.
    const byTitle = new Map(laws.map((l) => [l.title, l]))
    expect(byTitle.get("Do things that don't scale")?.sourceIds).toContain('pg-do-things-that-dont-scale')
    expect(byTitle.get('Make something people want')?.sourceIds).toContain('yc-essential-startup-advice')
  })
})

describe('resources validators (failure modes)', () => {
  const record = (over: Partial<ResourceRegistry['resources'][number]> = {}) => ({
    id: 'ok-record',
    title: 'A title',
    author: 'An author',
    url: 'https://example.com/x',
    kind: 'essay' as const,
    topics: ['topic'],
    note: 'A note.',
    published_on: null,
    checked_on: '2026-09-29',
    ...over,
  })
  const reg = (...resources: ResourceRegistry['resources']): ResourceRegistry => ({ updated_on: '2026-09-29', resources })

  it('rejects duplicate ids, plain-HTTP URLs, unknown kinds, and future checks', () => {
    expect(validateResourceRegistry(reg(record(), record()), AS_OF).join(';')).toContain('duplicate resource id')
    expect(validateResourceRegistry(reg(record({ url: 'http://example.com' })), AS_OF).join(';')).toContain('HTTPS')
    expect(
      validateResourceRegistry(reg(record({ kind: 'blog' as unknown as 'essay' })), AS_OF).join(';'),
    ).toContain('unknown kind')
    expect(validateResourceRegistry(reg(record({ checked_on: '2027-01-01' })), AS_OF).join(';')).toContain('future')
  })

  it('rejects laws with unresolved citations, no citations, or broken numbering', () => {
    const registry = reg(record({ id: 'real-source' }))
    const unknown = '## Stage\n\n### 1. A law\nBody.\nSources: `ghost-id`\n'
    expect(validateStartupLaws(unknown, registry).join(';')).toContain('unknown source id ghost-id')
    const uncited = '## Stage\n\n### 1. A law\nBody with no sources line.\n'
    expect(validateStartupLaws(uncited, registry).join(';')).toContain('missing Sources line')
    const misnumbered = '## Stage\n\n### 2. A law\nBody.\nSources: `real-source`\n'
    expect(validateStartupLaws(misnumbered, registry).join(';')).toContain('expected number 1')
    // And a too-short list is itself an error (the 25-40 corpus contract).
    expect(validateStartupLaws('## Stage\n\n### 1. Only law\nBody.\nSources: `real-source`\n', registry).join(';')).toContain('expected 25-40')
  })
})
