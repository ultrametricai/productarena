<!--
DRAFT — NOT POSTED. For human review before sending.

Target: https://github.com/unclecode/crawl4ai — new PR against `main`.
Change: add the sibling file `llms.txt` (this directory) as `docs/md_v2/llms.txt`.
  mkdocs.yml sets `docs_dir: docs/md_v2` and `site_url: https://docs.crawl4ai.com`, and MkDocs
  copies non-markdown files verbatim, so the file serves at https://docs.crawl4ai.com/llms.txt.
Context hook: issue #326 (closed, Jan 2025) asked for exactly this, and Crawl4AI ships its own
  llms.txt *generator* app (docs.crawl4ai.com/apps/llmtxt/) — the docs site itself just never
  got one.
No CLA/DCO found in CONTRIBUTING.md. Suggested title below; body follows the comment.
-->

# Suggested PR title

`docs: add llms.txt for docs.crawl4ai.com`

# Suggested PR body

Crawl4AI ships an llms.txt generator app, but docs.crawl4ai.com itself serves no
`llms.txt` (it returns 404 — checked 2026-09-11). This PR adds one — use it freely, change
anything, no attribution needed. It also closes the loop on #326, which asked for this back
in January 2025.

`llms.txt` (https://llmstxt.org) is a small markdown index at the docs root that tells AI
assistants and coding agents where the canonical docs live. This one was drafted from the
docs.crawl4ai.com sitemap: a one-line summary plus ~49 curated links (setup, core crawling,
extraction, advanced browser control, API reference) with short descriptions. Every URL was
checked to return HTTP 200 as of 2026-09-11.

Placement: `docs/md_v2/llms.txt` (`docs_dir` in mkdocs.yml), which MkDocs copies through to
the site root. Crawl4AI's users are, almost by definition, building LLM pipelines — their
agents get a reliable entry point into the current docs instead of scraping guesses.

For provenance: we maintain ProductArena, an open, evidence-based tracker of how agent-ready
developer products are, and Crawl4AI's page there is what surfaced the gap (our probe found
`docs.crawl4ai.com/llms.txt` returning 404):
https://ultrametric.ai/productarena/arena/web-scraping/product/crawl4ai

No expectation attached — if this isn't something the project wants, please just close, and
sorry for the noise. If it's welcome but you'd rather restructure or trim it (or generate it
with your own LLMText app instead — honestly the better story), it's plain markdown; happy to
adjust or for you to take it over entirely.
