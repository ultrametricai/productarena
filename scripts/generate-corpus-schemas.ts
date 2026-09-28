// Corpus lift stage 2 (docs/FOUNDER-OPS.md): publish the operational-process corpus contract as
// a standalone JSON Schema — schemas/operational-process.schema.json — so external consumers can
// validate processes/corpus.json records without running our TypeScript. The zod schemas in
// lib/processes.ts stay the single source of truth: this file is GENERATED from
// ProcessTaskSchema via zod's native z.toJSONSchema (no extra dependency — the repo's
// supply-chain minimumReleaseAge policy rules out adding zod-to-json-schema), and the drift test
// (__tests__/corpus-schemas.test.ts) fails if the committed output ever diverges from what the
// live zod schema generates. Regenerate with: npx tsx scripts/generate-corpus-schemas.ts
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { ProcessTaskSchema } from '../lib/processes'

const ROOT = path.resolve(__dirname, '..')
export const OPERATIONAL_PROCESS_SCHEMA_FILE = path.join(ROOT, 'schemas', 'operational-process.schema.json')

// The published schema text, byte-exact (2-space indent + trailing newline, the schemas/ house
// format). Deterministic: z.toJSONSchema walks the zod shape in declaration order and
// JSON.stringify preserves insertion order — no dates, no environment reads.
export function operationalProcessSchemaJson(): string {
  const { $schema, ...rest } = z.toJSONSchema(ProcessTaskSchema)
  const doc = {
    $schema,
    title: 'Ultrametric operational process',
    description:
      'One record of the operational founder-process corpus (processes/corpus.json is an array ' +
      'of these): a real startup operating process mapped as a DAG whose steps are routed ' +
      'agent/form/person, with curated cadence, geo scope, rank axes, and time estimates. ' +
      'Generated from ProcessTaskSchema in lib/processes.ts by ' +
      'scripts/generate-corpus-schemas.ts — edit the zod schema, never this file.',
    ...rest,
  }
  return `${JSON.stringify(doc, null, 2)}\n`
}

function main(): void {
  fs.writeFileSync(OPERATIONAL_PROCESS_SCHEMA_FILE, operationalProcessSchemaJson())
  console.log(`wrote ${path.relative(ROOT, OPERATIONAL_PROCESS_SCHEMA_FILE)}`)
}

if (require.main === module) main()
