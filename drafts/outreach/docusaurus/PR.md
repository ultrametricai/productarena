<!--
DRAFT — NOT POSTED. For human review before sending.

*** ON HOLD (2026-09-15 re-audit): a competing PR is OPEN. ***
facebook/docusaurus#11958 "feat(website): add agent docs plugin" (LucasLomiento, opened
2026-04-24) adds a local website plugin that emits /llms.txt, /llms-full.txt, section indexes,
and markdown routes at build time — strictly better than our static file. Do NOT open this PR
while #11958 is open. If #11958 merges: retire this draft (the surface flips anyway; re-probe
and re-judge). If #11958 is closed unmerged: send this version, which now references it.

Target: https://github.com/facebook/docusaurus — new PR against `main`.
Change: add the sibling file `llms.txt` (this directory) as `website/static/llms.txt`.
  docusaurus.io is built from `website/` in the same repo; files in `website/static/` serve at
  the site root (verified `_headers`, `_redirects`, `manifest.json` live there), so the file
  serves at https://docusaurus.io/llms.txt.
Requirements (2026-09-15 re-audit against the live repo):
  - PR body MUST contain .github/PULL_REQUEST_TEMPLATE.md — Pre-flight checklist, Motivation,
    Test Plan, Test links (deploy preview placeholder), Related issues/PRs. The body below is
    that template, filled in. (Homebrew #23967 was bot-closed for exactly this omission.)
  - Meta CLA must be signed before merge (founder action; can be signed after opening).
  - Founder must actually read CONTRIBUTING.md#pull-requests before ticking that box.
  - Re-verify docusaurus.io/llms.txt still 404 (last checked 2026-09-15: 404) and re-run the
    54-URL 200-check on send day.
Known context: core plugin PR #11420 closed unmerged; issue #10899 (open) tracks community
  plugins; #11958 (open) would generate agent docs for the website itself.
-->

# Suggested PR title

`docs(website): serve an llms.txt on docusaurus.io`

# Suggested PR body

## Pre-flight checklist

- [x] I have read the [Contributing Guidelines on pull requests](https://github.com/facebook/docusaurus/blob/main/CONTRIBUTING.md#pull-requests).
- [ ] **If this is a code change**: I have written unit tests and/or added dogfooding pages to fully verify the new behavior. *(Not a code change — one static file, no code paths.)*
- [ ] **If this is a new API or substantial change**: the PR has an accompanying issue (closes #0000) and the maintainers have approved on my working plan. *(Not an API or substantial change.)*

## Motivation

docusaurus.io serves no `llms.txt` (404 as of send day). This PR adds a hand-curated one as a
single static file (`website/static/llms.txt`) — use it freely, change anything, no
attribution needed.

To be clear about scope: this is **not** a plugin and adds no code. I know a core llms-txt
plugin was declined (#11420), the plugin conversation lives in #10899, and #11958 proposes
generating agent docs for this website at build time — this PR takes no position on any of
that and should lose to a generated version if one ships. It just gives docusaurus.io itself
what many Docusaurus *sites* already add via community plugins: a root index that tells AI
assistants and coding agents where the canonical docs live (https://llmstxt.org).

It was drafted from the docusaurus.io sitemap: a one-line summary plus ~54 curated links
(installation, guides, markdown features, advanced, plugin/theme API reference) with short
descriptions, pointing at the current-version docs. Every URL was checked to return HTTP 200
on send day. A huge share of "how do I configure my sidebar / versioning / swizzle" questions
now go through AI tools first — a stable index means they cite current pages instead of
v2-era scrapes. Compared with the existing sitemap.xml and human index, this is a *curated,
plain-text, stable* entry point sized for LLM context windows.

Disclosure: the file and this description were drafted with AI assistance; I reviewed every
line, ran the link verification myself, and am accountable for the change.

For provenance: we maintain ProductArena, an open, evidence-based tracker of how agent-ready
developer products are, and Docusaurus's page there is what surfaced the gap (our probe found
`docusaurus.io/llms.txt` returning 404):
https://ultrametric.ai/productarena/arena/docs-platforms/product/docusaurus

No expectation attached — if this isn't wanted (or you'd rather wait for a generated version
like #11958), please just close, and sorry for the noise.

## Test Plan

Static file only; no code paths. Verification: all ~54 URLs in the file return HTTP 200
(re-run on send day); the file is plain markdown per https://llmstxt.org. `website/static/`
files are copied to the site root at build time (as `_headers`, `_redirects`, and
`manifest.json` already are), so the Netlify deploy preview will serve it directly.

### Test links

Deploy preview: https://deploy-preview-_____--docusaurus-2.netlify.app/llms.txt

## Related issues/PRs

- #10899 — llms-txt plugin discussion (open)
- #11420 — core `@docusaurus/plugin-llms-txt` (closed unmerged; this is content, not a plugin)
- #11958 — agent docs plugin for this website (open; if it lands, that supersedes this file)
