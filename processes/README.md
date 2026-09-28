# Processes — human guides and machine-readable workflows

Two layers, deliberately separate:

1. **Jurisdiction-scoped workflows** (this tree, `processes/<domain>/<jurisdiction>/*.json`,
   contract in `schemas/process.schema.json`): source-backed legal/tax workflows with explicit
   applicability dimensions, dated editorial review, rule-card references, stop conditions, and
   a scoped human approval on every externally-effectful step. Validated by
   `lib/founderOps.ts` inside the normal test gates. The starter set is two demonstration US
   Delaware equity workflows (409A valuation review, 83(b) election) — status `demonstration`,
   not production-certified; see `governance/REVIEW_POLICY.md` for the maturity ladder.

2. **The operational corpus** (`corpus.json` in this directory, 123 processes rendered at
   `/processes`, contract in `schemas/operational-process.schema.json`):
   step-by-step operating DAGs with agent/manual/human routing, judged vendor rankings per
   step, agent ceilings, and time estimates. These are operating guides, not legal advice, and
   they carry no jurisdiction warranty — the site's jurisdiction toggle (`lib/jurisdictions.ts`)
   and geo scoping annotate where steps are US- or state-specific.

A process here may cite operational corpus pages for the how-to mechanics; the operational
corpus links back when a step crosses into fact-specific legal territory. The two layers keep
separate IDs and never silently substitute for each other. Stage 2 of the corpus lift
(2026-09-28) moved the operational corpus here from `data/processes.json`, byte-identical —
paths only: `lib/processes.ts` `loadProcesses()` reads `processes/corpus.json`, and the
founder-ops workflow validator (`lib/founderOps.ts`) deliberately skips `corpus.json` when it
walks this tree (the corpus has its own schema and gates). The two layers now live side by
side under this directory as promised.
