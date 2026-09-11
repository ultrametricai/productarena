# Gift draft: Crawl4AI llms.txt — maintainer review notes

**Status: draft. Nothing has been posted anywhere.** These files exist for a human to review,
edit, and send (or discard).

## Why Crawl4AI

- **Perfect audience fit**: 82,179 stars (checked 2026-09-11), and the user base is literally
  people building LLM/agent pipelines. There is even a closed issue asking for this
  (unclecode/crawl4ai#326, Jan 2025) and an in-docs llms.txt *generator* app
  (docs.crawl4ai.com/apps/llmtxt/) — the docs site itself never got one. Acceptance odds are
  about as high as this genre gets.
- **Our evidence**: `data/web-scraping/verdicts.json` records `agentic-agent-docs: none` and
  `agentic-mcp-server: partial` for crawl4ai; it ranks 4/6 in web-scraping (Arena Score 30.7),
  behind firecrawl — agent-docs is a real differentiator in that arena.
- **Contribution-friendly**: Apache-2.0, CONTRIBUTING.md present with no CLA/DCO requirement
  found, community PRs merged within days (e.g. #2241 merged 2026-09-09).

## Verification log (all read-only, 2026-09-11)

- `https://docs.crawl4ai.com/llms.txt` → HTTP 404 (text/html) — the gap is live.
- `https://docs.crawl4ai.com/sitemap.xml` → 200 (87 URLs — the whole site fits one screen).
- Repo layout: `mkdocs.yml` at repo root with `docs_dir: docs/md_v2` and
  `site_url: https://docs.crawl4ai.com` (checked via GitHub contents API) — non-markdown files
  in `docs/md_v2/` are copied to the site root.
- Dedupe: issue #326 is the only llms.txt match (closed, never shipped — llms.txt still 404).
- **Every URL in the drafted `llms.txt` verified HTTP 200 on 2026-09-11 (49/49, including the
  three Optional links).**
- Note: `extraction/clustring-strategies/` is their real URL (typo upstream, kept verbatim).

## What it flips on our side

- `web-scraping` / `crawl4ai` / `agentic-agent-docs`: currently `none` → re-judge once live.
- Certification: crawl4ai would then pass llms-txt; robots currently passes... actually
  `docs.crawl4ai.com/robots.txt` → 404 (which the suite treats as pass — nothing blocked).
  Remaining Agent-Ready gap after this lands: MCP or OpenAPI.

## Risks / etiquette

- Single-maintainer-led project (unclecode); response times vary. Easy-close framing matters.
- They might prefer regenerating with their own LLMText app — the PR body explicitly invites
  that (the goal is the file existing, not our version of it).

## Review checklist before sending

1. Re-run the URL 200-check.
2. Re-check for a newer llms.txt PR/issue.
3. Confirm `docs/md_v2/` is still the docs_dir on main.
