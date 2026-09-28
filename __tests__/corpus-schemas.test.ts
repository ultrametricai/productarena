import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { shape } from '@/lib/founderOps'
import {
  OPERATIONAL_PROCESS_SCHEMA_FILE, operationalProcessSchemaJson,
} from '../scripts/generate-corpus-schemas'

// Corpus lift stage 2: schemas/operational-process.schema.json is GENERATED from the zod source
// of truth (ProcessTaskSchema in lib/processes.ts) by scripts/generate-corpus-schemas.ts. These
// tests pin the two contracts that make the published schema trustworthy:
//   1. NO DRIFT — regenerating produces byte-identical committed output, so a zod-schema edit
//      that forgets to regenerate (or a hand-edit of the generated file) fails loudly.
//   2. THE CORPUS CONFORMS — every committed processes/corpus.json record validates against the
//      published schema with lib/founderOps.ts's shape() checker (the same structural validator
//      that gates the jurisdiction-scoped workflow layer), so the schema we publish is true of
//      the data we ship, not just of the code.

const ROOT = path.resolve(__dirname, '..')

describe('operational-process schema publication', () => {
  const committed = fs.readFileSync(OPERATIONAL_PROCESS_SCHEMA_FILE, 'utf8')

  it('regenerating produces byte-identical committed output (no drift)', () => {
    expect(operationalProcessSchemaJson()).toBe(committed)
  })

  it('is a draft-2020-12 object schema with the corpus\'s load-bearing requireds', () => {
    const schema = JSON.parse(committed)
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(schema.type).toBe('object')
    // The five founder orderings + the GEO dimension are required by construction — the schema
    // must publish that, or external validators would accept an untagged process our loader
    // rejects.
    for (const key of ['id', 'title', 'geoScope', 'cadence', 'timeOrder', 'annoyance', 'risk', 'growthImpact', 'dag']) {
      expect(schema.required, `required ${key}`).toContain(key)
    }
  })

  it('every committed corpus record validates against the published schema via shape()', () => {
    const schema = JSON.parse(committed)
    const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, 'processes', 'corpus.json'), 'utf8'))
    expect(Array.isArray(corpus)).toBe(true)
    expect(corpus.length).toBeGreaterThanOrEqual(100)
    const errors: string[] = []
    for (const record of corpus) {
      shape(record, schema, `process ${record?.id ?? '?'}`, errors)
    }
    expect(errors).toEqual([])
  })
})
