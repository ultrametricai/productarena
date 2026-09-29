# Templates — contribution starting points

`process.json` and `vendor-review.json` are blank, schema-valid starting points for new
jurisdiction-scoped workflows and vendor reviews. Copy, narrow the applicability, add source
records for every legal assertion, include a fictional fixture, and run the gates
(`npx vitest run __tests__/founder-ops.test.ts`). Full workflow in
`governance/REVIEW_POLICY.md`.

## What you can contribute here

- **Keep the blanks schema-valid** — if a schema in `schemas/` gains a field, the matching
  template here should gain it too, still blank and still valid. Gate: fill a copy with a
  fictional scenario and run `npx vitest run __tests__/founder-ops.test.ts`.
- **A new template** — when a record type gets a contribution path (a new schema in
  `schemas/`), add its blank starting point here so contributors copy instead of
  reverse-engineering an existing record.
