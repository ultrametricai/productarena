# Sources — primary authorities

`registry.json` holds every primary source the rule cards cite: publisher, exact provision
locator, `issued_on` where known, `checked_on` (the date a human last verified it), and an
HTTPS link. A legal rule card may only cite `primary-*` sources; provider blogs can explain
practice but cannot establish law (`kind: secondary-practice`).

This is the legal-layer sibling of the evidence provenance the vendor layer already runs on:
every judged verdict in `data/<arena>/` cites evidence IDs, recorded probes and proofs carry
transcripts, and `_provenance` blocks in the committed rankings are HMAC-fingerprinted and
recomputable (`pipeline/scripts/recompute-check.ts`). Same doctrine, two record shapes: nothing
is asserted without a dated, checkable source.

## What you can contribute here

- **Primary sources for new rule cards** — add entries to `sources/registry.json` (publisher,
  exact provision locator, `issued_on` where known, `checked_on`, HTTPS link) alongside the
  `rules/<CODE>/*.json` cards that cite them. Legal cards may only cite `primary-*` kinds;
  practical guides go in as `kind: secondary-practice`.
- **Re-verification passes** — follow an existing source's link, confirm the provision still
  says what the card claims, and bump `checked_on` (with a note if the provision moved).

Gate for both: `npx vitest run __tests__/founder-ops.test.ts` (every rule card must resolve to
a registered source with an exact locator).
