# Canonical rule cards

One proposition per stable rule ID, scoped to a jurisdiction and backed by exact source locators. Processes reference IDs so an agency or statute change can be traced to all affected workflows. A rule's `reviewed_on` and `review_due` document editorial checks; they do not establish a legal effective interval. Unknown `valid_from` and `valid_until` remain null until verified. Do not reuse an ID to change the meaning of an old rule: version it and document the affected process revisions.

## What you can contribute here

- **Rule cards for a new jurisdiction** — register the jurisdiction in
  `jurisdictions/registry.json` with an honest, narrow scope, then add `rules/<CODE>/*.json`
  cards (one proposition per stable ID) citing `primary-*` sources in
  `sources/registry.json` — statute, regulation, or agency guidance; a provider blog cannot
  establish law. Never copy US rules into another jurisdiction.
- **Refresh an existing card** — re-verify against the primary source and bump
  `reviewed_on`/`review_due`; if the meaning changed, version the ID rather than editing it in
  place, and note the affected process revisions.

Gate for both: `npx vitest run __tests__/founder-ops.test.ts` (source resolution, jurisdiction
matching, ID stability).
