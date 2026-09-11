# Gift draft: Docusaurus llms.txt — maintainer review notes

**Status: draft. Nothing has been posted anywhere.** These files exist for a human to review,
edit, and send (or discard).

## Why Docusaurus

- **The meta-story**: Docusaurus is a docs *platform* (our docs-platforms arena) whose own site
  doesn't serve llms.txt. Landing it on docusaurus.io is visible to every Docusaurus site
  owner — the best distribution-per-line-changed on this list.
- **Demand is documented upstream**: issue #10899 (open) tracks llms-txt plugin interest; the
  team added a "AI/Agents" community-plugins docs section (PR #12035 merged 2026-05-28) and
  merged listings for two such plugins since. They are receptive to the topic.
- **Our evidence**: `data/docs-platforms/verdicts.json` records `agentic-agent-docs: none` for
  docusaurus; it ranks 3/5 in docs-platforms (Arena Score 31.8) behind mintlify/gitbook — both
  of which serve llms.txt for their own docs.
- **Active**: 66,228 stars, pushed 2026-09-11, maintainer merges daily.

## Verification log (all read-only, 2026-09-11)

- `https://docusaurus.io/llms.txt` → HTTP 404 (text/html) — the gap is live.
- `https://docusaurus.io/sitemap.xml` → 200 (1,366 URLs; 92 current-version docs pages after
  dropping /docs/next and versioned paths — the draft links ~54).
- Repo layout: `website/static/` exists with `_headers`, `_redirects`, `manifest.json`
  (GitHub contents API) — static files serve at the site root.
- Dedupe/context: PR #11420 "feat: add @docusaurus/plugin-llms-txt" was **closed unmerged**
  (2025-10) — the core team declined a core plugin. Open issue #10899 discusses community
  plugins. Our PR is a single static file for docusaurus.io, not a plugin; the body
  distinguishes this explicitly and offers to yield to a plugin-generated version.
- **Every URL in the drafted `llms.txt` verified HTTP 200 on 2026-09-11 (54/54, including the
  five Optional links).**

## What it flips on our side

- `docs-platforms` / `docusaurus` / `agentic-agent-docs`: currently `none` → re-judge once
  live.

## Risks / etiquette

- **Meta CLA required** — the submitting human must sign Facebook's CLA (one-time, online).
- The team may close in favor of "do it with a community plugin" — the body pre-concedes that
  outcome gracefully; even a close often converts into them wiring the plugin, which still
  flips the surface (and our verdict follows the live probe either way).
- docusaurus.io docs are versioned; the draft points at the unversioned current-docs paths
  (`/docs/...`), which are stable across releases.

## Review checklist before sending

1. Sign the Meta CLA before opening the PR.
2. Re-run the URL 200-check.
3. Re-read #10899 for a change in the team's plugin plans; if a first-party generator has
   shipped since, convert this into a config PR wiring it instead.
