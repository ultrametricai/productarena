# Processes — human guides and machine-readable workflows

Two layers, deliberately separate:

1. **Jurisdiction-scoped workflows** (this tree, `processes/<domain>/<jurisdiction>/*.json`,
   contract in `schemas/process.schema.json`): source-backed legal/tax workflows with explicit
   applicability dimensions, dated editorial review, rule-card references, stop conditions, and
   a scoped human approval on every externally-effectful step. Validated by
   `lib/founderOps.ts` inside the normal test gates. The starter set is two demonstration US
   Delaware equity workflows (409A valuation review, 83(b) election) — status `demonstration`,
   not production-certified; see `governance/REVIEW_POLICY.md` for the maturity ladder.

2. **The operational corpus** (`data/processes.json`, 123 processes rendered at `/processes`):
   step-by-step operating DAGs with agent/manual/human routing, judged vendor rankings per
   step, agent ceilings, and time estimates. These are operating guides, not legal advice, and
   they carry no jurisdiction warranty — the site's jurisdiction toggle (`lib/jurisdictions.ts`)
   and geo scoping annotate where steps are US- or state-specific.

A process here may cite operational corpus pages for the how-to mechanics; the operational
corpus links back when a step crosses into fact-specific legal territory. The two layers keep
separate IDs and never silently substitute for each other. `data/processes.json` stays in place
until stage 2 of the corpus lift (it is fingerprinted and loader-bound); the layers will then
live side by side under this directory.
