<!--
DRAFT — NOT POSTED. For human review before sending.

Target: https://github.com/Homebrew/brew — new PR against `main`.
Change: add the sibling file `llms.txt` (this directory) as `docs/llms.txt`.
  docs.brew.sh is Jekyll built from `docs/` (CNAME lives there); plain files pass through —
  `docs/robots.txt` already serves at https://docs.brew.sh/robots.txt (verified 200,
  2026-09-11), so `docs/llms.txt` serves at https://docs.brew.sh/llms.txt.
Etiquette: Homebrew publishes a Responsible AI Usage policy (docs.brew.sh/Responsible-AI-Usage)
  — the submitting human should read it and disclose AI assistance in drafting per that policy.
No CLA/DCO requirement found in CONTRIBUTING.md. Suggested title below; body follows.
-->

# Suggested PR title

`docs: add llms.txt index for docs.brew.sh`

# Suggested PR body

This PR adds an `llms.txt` for docs.brew.sh — use it freely, change anything, no attribution
needed.

`llms.txt` (https://llmstxt.org) is a small markdown index served at a docs site's root that
tells AI assistants and coding agents where the canonical documentation lives. Homebrew
already meets these tools halfway (the docs ship an MCP Server page, and the site serves clean
per-page markdown sources); the missing piece is the root index. This one was drafted from the
docs.brew.sh sitemap: a one-line summary plus ~49 curated links (installation, usage, the
brew(1) manpage, formula/cask cookbooks, taps, governance/security) with short descriptions.
Every URL was checked to return HTTP 200 as of 2026-09-11.

Placement: `docs/llms.txt` — the same static passthrough that already serves
`docs/robots.txt` at https://docs.brew.sh/robots.txt. Given how often people ask AI tools
"how do I write a formula" or "why is brew doctor complaining", a stable index means those
tools cite current pages rather than stale scrapes.

Disclosure: this file was drafted with AI assistance from the sitemap and then human-reviewed;
every link was mechanically verified. Happy to adjust anything to fit the Prose Style
Guidelines.

For provenance: we maintain ProductArena, an open, evidence-based tracker of how agent-ready
developer products are, and Homebrew's page there is what surfaced the gap (our probe found
`docs.brew.sh/llms.txt` returning 404):
https://ultrametric.ai/productarena/arena/package-managers/product/homebrew

No expectation attached — if this isn't something the project wants, please just close, and
sorry for the noise. If it's welcome but you'd rather restructure or trim it, it's plain
markdown; happy to adjust or for you to take it over entirely.
