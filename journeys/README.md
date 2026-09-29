# Journeys — multi-process founder paths

A journey chains processes into a founder-visible path: start a company, hire, grant equity,
raise, launch, expand, exit.

**Current implementation:** the 24 process chains in `chains.json` in this directory
(incorporation →
launch, the VC raise, month-end close, tax season, the agent-run back office…), rendered as
playbooks at `/processes` and driven end-to-end by the Virtual Startup (`/virtual-startup`),
which runs a simulated company through the real corpus with every step routed
agent / manual / human.

**Stage 2 of the corpus lift (done 2026-09-28):** the chains moved here from
`data/process-chains.json`, byte-identical — paths only (`lib/processes.ts` `loadChains()` now
reads `journeys/chains.json`; loaders, fingerprints, and determinism gates unchanged).
Journey records referencing jurisdiction-scoped workflows from `processes/` when a leg is
legal-rigor territory (e.g. the equity-grant leg pointing at `equity.us-de.83b-election`)
remain future work.

## What you can contribute here

- **A new chain** — add an entry to `journeys/chains.json` linking existing process IDs from
  `processes/corpus.json` into a founder-visible path (a country-specific incorporation →
  launch sequence, a wind-down, a first-enterprise-deal path). Every referenced process must
  already exist; chains never invent steps.
- **Fixes to an existing chain** — reordering, a missing leg, or a better description, with
  the reasoning in the PR.

Gate for both: `pnpm test` (`lib/__tests__/processes.test.ts` loads and cross-checks every
chain against the corpus).
