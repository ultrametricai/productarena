# Schemas — the JSON Schema contracts

The published contracts for the corpus record types: `process.schema.json` (jurisdiction-scoped
workflows), `operational-process.schema.json` (the operational corpus), `rule.schema.json`,
`source.schema.json`, and `vendor-review.schema.json`. Every record in `processes/`, `rules/`,
`sources/`, and `vendors/reviews/` validates against these in CI.

`operational-process.schema.json` is **generated** from the zod source of truth by
`scripts/generate-corpus-schemas.ts` and drift-gated byte-identical by
`__tests__/corpus-schemas.test.ts` — never hand-edit it; change the zod schema and regenerate.

## What you can contribute here

- **A field the records need** — propose it by changing the zod source (for generated schemas)
  or the schema file plus the validator (`lib/founderOps.ts`) together, with at least one real
  record and the matching blank in `templates/` updated in the same PR. Gates:
  `npx vitest run __tests__/corpus-schemas.test.ts` (drift) and
  `npx vitest run __tests__/founder-ops.test.ts` (records still validate).
- **A schema for a new record type** — only alongside the contribution path that uses it: the
  schema, a template in `templates/`, validator wiring, and a first record land as one PR.
