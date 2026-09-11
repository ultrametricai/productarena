<!--
DRAFT — NOT POSTED. For human review before sending.

Target: https://github.com/facebook/docusaurus — new PR against `main`.
Change: add the sibling file `llms.txt` (this directory) as `website/static/llms.txt`.
  docusaurus.io is built from `website/` in the same repo; files in `website/static/` serve at
  the site root (verified `_headers`, `_redirects`, `manifest.json` live there), so the file
  serves at https://docusaurus.io/llms.txt.
Requirement: Meta CLA must be signed before the PR can merge (facebook org standard).
Known context: the core team closed PR #11420 (a core @docusaurus/plugin-llms-txt) in favor of
  community plugins, and issue #10899 tracks the plugin discussion. THIS PR IS NOT A PLUGIN —
  it is one static file for docusaurus.io itself. The body says so explicitly, and offers the
  alternative of wiring a community plugin instead if they prefer generated output.
Suggested title below; body follows the comment.
-->

# Suggested PR title

`docs(website): serve an llms.txt on docusaurus.io`

# Suggested PR body

This PR adds a hand-curated `llms.txt` for docusaurus.io as one static file
(`website/static/llms.txt`) — use it freely, change anything, no attribution needed.

To be clear about scope: this is **not** a plugin and adds no code. I know a core llms-txt
plugin was declined (#11420) and the plugin conversation lives in #10899 — this PR takes no
position on any of that. It just gives docusaurus.io itself what many Docusaurus *sites*
already add via community plugins: a root index that tells AI assistants and coding agents
where the canonical docs live (https://llmstxt.org).

It was drafted from the docusaurus.io sitemap: a one-line summary plus ~54 curated links
(installation, guides, markdown features, advanced, plugin/theme API reference) with short
descriptions, pointing at the current-version docs. Every URL was checked to return HTTP 200
as of 2026-09-11. A huge share of "how do I configure my sidebar / versioning / swizzle"
questions now go through AI tools first — a stable index means they cite current pages instead
of v2-era scrapes.

If the team would rather generate this at build time with one of the community plugins listed
in the AI/Agents plugins section, that's strictly better — happy to close this in favor of
that, or to keep the static file as a stopgap until then.

For provenance: we maintain ProductArena, an open, evidence-based tracker of how agent-ready
developer products are, and Docusaurus's page there is what surfaced the gap (our probe found
`docusaurus.io/llms.txt` returning 404):
https://ultrametric.ai/productarena/arena/docs-platforms/product/docusaurus

No expectation attached — if this isn't wanted, please just close, and sorry for the noise.
