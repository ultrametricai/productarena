---
venue: gitea.com/gitea/docs (their own Gitea instance — NOT GitHub; go-gitea/docs on GitHub is archived since 2017)
change: add one file — static/llms.txt (118 lines; serves at https://docs.gitea.com/llms.txt, same mechanism as their existing static/openapi3-latest.json)
status: draft — requires founder sign-off before posting; posting requires a gitea.com account
---

# PR title

Add llms.txt — a machine-readable docs index for AI agents and assistants

# PR body (verbatim)

This adds an `llms.txt` ([llmstxt.org](https://llmstxt.org)) at the docs site root — a small
markdown index that tells AI coding tools and agents where the canonical docs live, so they
answer questions about Gitea from the current docs instead of scraping guesses across
versioned paths.

What's in it: a one-line summary of Gitea plus ~85 curated links (installation,
administration, usage, Actions, packages, API) with short descriptions, drafted from the
docs.gitea.com sitemap. Every URL returned HTTP 200 at draft time. It also points agents at
the self-describing per-instance API (`{instance}/api/swagger` and `swagger.v1.json`).

It's placed in `static/` so Docusaurus serves it verbatim at `docs.gitea.com/llms.txt` — the
same mechanism as the existing `static/openapi3-latest.json`.

Use it freely, restructure or trim anything, no attribution needed. For provenance: we
maintain ProductArena, an open evidence-based tracker of how agent-ready developer products
are, and Gitea's page there is what surfaced the gap (our probe found
`docs.gitea.com/llms.txt` returning 404):
https://ultrametric.ai/productarena/arena/code-hosting/product/gitea

If this isn't something the project wants, please just close — no expectation attached.

# The file

`static/llms.txt` → exactly the committed draft at `drafts/outreach/gitea/llms.txt`
(118 lines, 89 URLs verified HTTP 200 on 2026-09-08; re-verify before posting).

# Pre-send checklist

1. Re-run the 200-check on all URLs (see NOTES.md).
2. Confirm docs.gitea.com/llms.txt still 404s (they may have added one).
3. Post from a real account (gitea.com), sign the DCO if their flow requires (check .gitea templates).
