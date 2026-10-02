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
import { ArtifactRegistrySchema, ProcessTaskSchema, VendorRegistrySchema } from '../lib/processes'

const ROOT = path.resolve(__dirname, '..')
export const OPERATIONAL_PROCESS_SCHEMA_FILE = path.join(ROOT, 'schemas', 'operational-process.schema.json')
export const VENDOR_REGISTRY_SCHEMA_FILE = path.join(ROOT, 'schemas', 'process-vendor-registry.schema.json')
export const ARTIFACT_REGISTRY_SCHEMA_FILE = path.join(ROOT, 'schemas', 'process-artifacts.schema.json')

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

// The vendor-registry contract (SSOT migration, founder audit 2026-09-30): the vendor facts the
// process pages render moved out of TypeScript into processes/vendor-registry.json; this schema
// is generated from the same zod source of truth (VendorRegistrySchema in lib/processes.ts) and
// drift-tested the same way.
export function vendorRegistrySchemaJson(): string {
  const { $schema, ...rest } = z.toJSONSchema(VendorRegistrySchema)
  const doc = {
    $schema,
    title: 'Ultrametric process vendor registry',
    description:
      'The vendor registry beside the operational-process corpus ' +
      '(processes/vendor-registry.json): per corpus vendor key, the arena that judges the ' +
      'vendor, its display label where title-casing misfires, its judged product id where it ' +
      'differs from the key, and its verified-live start-here page — with honest curation ' +
      'notes. Generated from VendorRegistrySchema in lib/processes.ts by ' +
      'scripts/generate-corpus-schemas.ts — edit the zod schema, never this file.',
    ...rest,
  }
  return `${JSON.stringify(doc, null, 2)}\n`
}

// The artifact-registry contract (founder depth wave part 2, 2026-10-01): the canonical
// business artifacts that flow between processes live in processes/artifacts.json; this schema
// is generated from the same zod source of truth (ArtifactRegistrySchema in lib/processes.ts)
// and drift-tested the same way.
export function artifactRegistrySchemaJson(): string {
  const { $schema, ...rest } = z.toJSONSchema(ArtifactRegistrySchema)
  const doc = {
    $schema,
    title: 'Ultrametric process artifact registry',
    description:
      'The artifact vocabulary beside the operational-process corpus ' +
      '(processes/artifacts.json): the canonical business artifacts that flow between ' +
      'processes — per artifact its id, label, description, one canonical producer process, ' +
      'documented exception producers, and a terminal flag for artifacts nothing downstream ' +
      'consumes. Generated from ArtifactRegistrySchema in lib/processes.ts by ' +
      'scripts/generate-corpus-schemas.ts — edit the zod schema, never this file.',
    ...rest,
  }
  return `${JSON.stringify(doc, null, 2)}\n`
}

function main(): void {
  fs.writeFileSync(OPERATIONAL_PROCESS_SCHEMA_FILE, operationalProcessSchemaJson())
  console.log(`wrote ${path.relative(ROOT, OPERATIONAL_PROCESS_SCHEMA_FILE)}`)
  fs.writeFileSync(VENDOR_REGISTRY_SCHEMA_FILE, vendorRegistrySchemaJson())
  console.log(`wrote ${path.relative(ROOT, VENDOR_REGISTRY_SCHEMA_FILE)}`)
  fs.writeFileSync(ARTIFACT_REGISTRY_SCHEMA_FILE, artifactRegistrySchemaJson())
  console.log(`wrote ${path.relative(ROOT, ARTIFACT_REGISTRY_SCHEMA_FILE)}`)
}

if (require.main === module) main()
