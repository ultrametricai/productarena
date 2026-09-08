<!--
DRAFT — NOT POSTED. For human review before sending.

Suggested target: https://github.com/go-gitea/gitea (new issue), or a PR against
https://gitea.com/gitea/docs adding the file to the docs site's static assets.
Suggested title: "Proposal: serve an llms.txt on docs.gitea.com (drafted one, use freely)"
Attach or inline: drafts/outreach/gitea/llms.txt
-->

Hi — we drafted an `llms.txt` for the Gitea documentation and are offering it upstream: use it freely, change anything, no attribution needed. It's attached/inlined below.

`llms.txt` (https://llmstxt.org) is a small markdown index at the site root that tells AI coding tools and agents where the canonical docs live. It was drafted from the docs.gitea.com sitemap — a one-line summary plus ~85 curated links (installation, administration, usage, Actions, packages, API) with short descriptions; every URL was checked to return 200 as of 2026-09-08. Serving it at `https://docs.gitea.com/llms.txt` gives agents and AI assistants a reliable entry point into the current docs instead of scraping guesses across versioned paths, which tends to mean fewer wrong answers about Gitea from those tools.

For provenance: we maintain ProductArena, an open, evidence-based tracker of how agent-ready developer products are, and Gitea's page there is what surfaced the gap (our probe found `docs.gitea.com/llms.txt` returning 404): https://ultrametric.ai/productarena/arena/code-hosting/product/gitea

No expectation attached — if this isn't something the project wants, please just close this issue, and sorry for the noise. If it's welcome but you'd rather restructure or trim it, it's plain markdown; happy to adjust or for you to take it over entirely.
