# Journeys — multi-process founder paths

A journey chains processes into a founder-visible path: start a company, hire, grant equity,
raise, launch, expand, exit.

**Current implementation:** the 24 process chains in `data/process-chains.json` (incorporation →
launch, the VC raise, month-end close, tax season, the agent-run back office…), rendered as
playbooks at `/processes` and driven end-to-end by the Virtual Startup (`/virtual-startup`),
which runs a simulated company through the real corpus with every step routed
agent / manual / human.

**Planned (stage 2 of the corpus lift):** chains move here as first-class journey records that
can also reference jurisdiction-scoped workflows from `processes/` when a leg of the journey is
legal-rigor territory (e.g. the equity-grant leg pointing at `equity.us-de.83b-election`).
Until then this directory documents the mapping; `data/process-chains.json` stays canonical so
the site's loaders, fingerprints, and determinism gates are untouched.
