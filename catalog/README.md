# Catalog — domains, lifecycle, and coverage

`domains.json` is the full founder-journey taxonomy (formation → governance → finance → tax →
equity → fundraising → people → product → revenue → trust → operations → international → exit),
including domains that have no playbook yet. `coverage.json` is the machine-readable coverage
registry: which scenarios have workflows, at what maturity, with what known gaps. No one may
claim a country is covered because a few playbooks exist — see `governance/REVIEW_POLICY.md`.

## How this maps onto the rest of the repo

- **Arenas** (`data/categories.json`, rendered at `/arenas`) are the vendor-evaluation cut of
  the same territory: each domain's tooling questions become head-to-head, evidence-judged
  product rankings.
- **Operational processes** (`processes/corpus.json`, rendered at `/processes`) are grouped into
  nine operating areas (`lib/processRows.ts` `AREA_ORDER`) that crosswalk onto these domains:
  Starting up → start/formation, Fundraising & investors → fundraising, Money & finance →
  finance, Team & payroll → people, Legal → governance, Ongoing compliance & tax → tax,
  Running operations → operations/trust, Building & shipping → product, Growth & sales →
  revenue.
- **Jurisdiction-scoped workflows** (`processes/<domain>/<jurisdiction>/` in this tree) are the
  legal-rigor layer: source-backed, dated, with explicit applicability and human-approval gates.

Coverage in `coverage.json` tracks only the jurisdiction-scoped workflow layer. The operational
corpus and the arenas publish their own coverage honestly on their own pages.
