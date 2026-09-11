<!--
DRAFT — NOT POSTED. For human review before sending.

Target: https://github.com/vllm-project/vllm — new PR against `main`.
Change: add the sibling file `llms.txt` (this directory) as `docs/llms.txt`.
  MkDocs copies non-markdown files in `docs/` into the built site verbatim, and Read the Docs
  serves root-level files from the default version's build root (RTD's own docs serve
  https://docs.readthedocs.com/llms.txt this way — verified HTTP 200 on 2026-09-11). Worst
  case it lands at https://docs.vllm.ai/en/latest/llms.txt, which is still a win.
Requirement: DCO sign-off (`git commit -s`) — the DCO check is enforced on every vLLM PR.
Suggested title below; body follows the comment.
-->

# Suggested PR title

`[Doc] Add llms.txt so agents and AI tools can find the canonical docs`

# Suggested PR body

This PR adds an `llms.txt` for docs.vllm.ai — use it freely, change anything, no attribution
needed.

`llms.txt` (https://llmstxt.org) is a small markdown index served at a docs site's root that
tells AI assistants and coding agents where the canonical documentation lives. This one was
drafted from the docs.vllm.ai sitemap: a one-line summary plus ~50 curated links (quickstart,
serving, deployment, configuration, features, models, CLI, usage) with short descriptions.
Every URL was checked to return HTTP 200 against `/en/latest/` as of 2026-09-11.

Placement: `docs/llms.txt`. MkDocs copies non-markdown files through to the built site, and
Read the Docs serves root files from the default version's build output (Read the Docs' own
docs serve their `llms.txt` at https://docs.readthedocs.com/llms.txt the same way), so this
should surface at `https://docs.vllm.ai/llms.txt`. A lot of people now ask coding agents how
to deploy and tune vLLM; a stable root index means those tools cite current pages instead of
guessing across versioned paths.

For provenance: we maintain ProductArena, an open, evidence-based tracker of how agent-ready
developer products are, and vLLM's page there is what surfaced the gap (our probe found
`docs.vllm.ai/llms.txt` returning 404):
https://ultrametric.ai/productarena/arena/local-llm-runtimes/product/vllm

No expectation attached — if this isn't something the project wants, please just close, and
sorry for the noise. If it's welcome but you'd rather restructure or trim it, it's plain
markdown; happy to adjust or for you to take it over entirely.
