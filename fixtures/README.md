# Fixtures — fictional companies and events

Entirely fictional scenario events used to exercise workflow discovery and the conservative
planner (`lib/founderOps.ts`), asserted `synthetic: true` and validated for full scenario
dimensions by the corpus gates. Never production records, never real companies, never PII —
see `governance/SECURITY.md`. The Open Startup's simulated companies
(`lib/virtualStartupRun.ts`) are this same doctrine on the site surface: every generated
artifact carries a visible SIMULATED tag and nothing simulated is a judged fact.

## What you can contribute here

- **A fixture for every new workflow** — each jurisdiction-scoped workflow PR should land with
  a fictional scenario event here (`fixtures/<scenario>.json`) that exercises it: full
  scenario dimensions, `synthetic: true`, invented company names, no real people or PII.
- **Planner edge cases** — fixtures that should match nothing (like `unsupported-gb.json`) are
  as valuable as ones that match: they pin the conservative planner's refusal behavior.

Gate for both: `npx vitest run __tests__/founder-ops.test.ts` (synthetic flag + full-dimension
checks on every fixture).
