# The founder-ops corpus — architecture and lift plan

Ingested from the founder-ops-open starter (founder, 2026-09-28) and adjusted to this repo:
Ultrametric is lifting from a vendor-evidence layer into an open operating system for starting
and running a company — **index → scenario match → source-backed process → private execution
record**. The public repo stores reusable knowledge, schemas, fictional fixtures, and vendor
evidence. A company's facts, decisions, documents, and audit log belong in its private
workspace, never here.

## The tree

| Path | Purpose |
| --- | --- |
| `catalog/` | Domain taxonomy, lifecycle navigation, machine-readable coverage and gaps |
| `journeys/` | Multi-process founder paths (chains; Virtual Startup is the live surface) |
| `processes/` | Jurisdiction-scoped legal workflows + the operational corpus (two layers) |
| `rules/<jurisdiction>/` | Canonical, dated legal rule cards with stable IDs |
| `sources/` | Primary authorities: provision locators, issue dates, checked dates |
| `jurisdictions/` | Registry + overlays; exact-dimension matching, unknown = unsupported |
| `business-logic/` | Cited, deterministic calculations (cap table first) |
| `vendors/` | The evidence layer + the scenario-scoped review interchange format |
| `connectors/` | Optional vendor/government integrations behind approval gates |
| `templates/` | Contribution starting points |
| `schemas/` | JSON Schema contracts for processes, rules, sources, vendor reviews |
| `fixtures/` | Fictional companies and events only |
| `apps/` | Map of the site / CLI / MCP / worker surfaces |
| `governance/` | Review policy, evidence doctrine, agent policy, security |

Record semantics (from the starter, binding): process IDs are stable and `version` changes on
substantive edits; `rule_ids` resolve to rule cards which resolve to primary sources with exact
locators; `reviewed_on`/`review_due` are editorial dates, never legal effective dates
(`valid_from`/`valid_until` stay null until verified); every `external_effect` step requires a
named, scoped human approval; the matcher rejects unknown jurisdiction combinations rather than
guessing. The validator (`lib/founderOps.ts`, gated by `__tests__/founder-ops.test.ts`) checks
structure and semantic invariants; it does not prove laws true or implement a calendar engine.

## Lift stages

- **Stage 1 — done 2026-09-28.** Tree scaffolded; starter records ingested verbatim (US-FED +
  US-DE rule cards, the 409A and 83(b) demonstration workflows, sources, registries, fixtures,
  templates, schemas); validator + planner ported from Python into `lib/founderOps.ts` so the
  corpus gates run inside vitest; governance merged with the repo's existing evidence doctrine;
  every directory README bridges to the live implementation. `data/processes.json`,
  `data/process-chains.json`, and the arena data deliberately did not move (fingerprinted,
  loader-bound, and under active lanes).
- **Stage 2.** Consolidate: move chains into `journeys/` and the operational corpus under
  `processes/` behind the loaders; extract the site's zod schemas as published JSON Schema into
  `schemas/`; generate vendor-review interchange records from judged arena data; fold the geo
  work (process geo-scope, vendor region availability) into `jurisdictions/` + `rules/`;
  surface the workflow layer on the site (a `/founder-ops` or per-process "legal layer" view).
- **Stage 3.** Physically move the site/CLI/MCP/worker under `apps/` as workspace packages.
  Deploy-infra churn only; deliberately last.

## Suggested service boundary (unchanged from the starter)

1. Public catalog and source registry, versioned by Git. 2. Private company graph. 3. Rules and
planning service emitting plans with uncertainties. 4. Policy engine for human approvals.
5. Adapter layer with scopes, vaults, dry-run, idempotency. 6. Audit store with receipts and
post-action verification. The public repo carries no accounts, keys, or default vendor.
