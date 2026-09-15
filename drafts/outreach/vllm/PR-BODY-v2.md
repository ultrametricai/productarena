## Purpose

Add an `llms.txt` index for docs.vllm.ai so AI assistants and coding agents can find the
canonical docs from one machine-readable entry point (docs.vllm.ai/llms.txt currently 404s —
re-checked 2026-09-14).

This PR adds an `llms.txt` for docs.vllm.ai — use it freely, change anything, no attribution
needed.

`llms.txt` (https://llmstxt.org) is a small markdown index served at a docs site's root that
tells AI assistants and coding agents where the canonical documentation lives. This one was
drafted from the docs.vllm.ai sitemap: a one-line summary plus ~50 curated links (quickstart,
serving, deployment, configuration, features, models, CLI, usage) with short descriptions.
Every URL was checked to return HTTP 200 against `/en/latest/` as of 2026-09-14.

Placement: `docs/llms.txt`. MkDocs copies non-markdown files through to the built site, and
Read the Docs serves root files from the default version's build output (Read the Docs' own
docs serve their `llms.txt` at https://docs.readthedocs.com/llms.txt the same way), so this
should surface at `https://docs.vllm.ai/llms.txt`. A lot of people now ask coding agents how
to deploy and tune vLLM; a stable root index means those tools cite current pages instead of
guessing across versioned paths.

## AI-assistance disclosure (per AGENTS.md)

- **AI assistance was used** to draft the `llms.txt` file (curation from the sitemap and the
  link descriptions) and this PR description. A human (the submitter) reviewed every line,
  ran the link verification, opened the PR, and is accountable for the change end-to-end.
- **Not a duplicate**: before opening, we searched open and closed PRs/issues for
  `llms.txt` / `llms` in vllm-project/vllm (`gh pr list --state all --search "llms.txt"`,
  `gh issue list --search "llms.txt"`) — no existing PR or issue proposes adding this file
  (re-checked 2026-09-15; this PR is the only match).
- **Model-evaluation results**: not applicable — this adds one static docs file; no code
  paths, output, accuracy, or serving behavior are affected.

## Test Plan

Docs-only static file. Verification performed: every one of the 50 URLs in the index was
checked to return HTTP 200 (curl, 2026-09-14); the file is plain markdown per the llms.txt
spec (https://llmstxt.org). MkDocs copies non-markdown files in `docs/` into the built site
verbatim, so no build configuration changes are needed. The Read the Docs preview build for
this PR can confirm the file lands in the build output.

## Test Result

All 50 links 200 OK; no code paths touched, so no test-suite impact.

For provenance: we maintain ProductArena, an open, evidence-based tracker of how agent-ready
developer products are, and vLLM's page there is what surfaced the gap (our probe found
`docs.vllm.ai/llms.txt` returning 404):
https://ultrametric.ai/productarena/arena/local-llm-runtimes/product/vllm

No expectation attached — if this isn't something the project wants, please just close, and
sorry for the noise. If it's welcome but you'd rather restructure or trim it, it's plain
markdown; happy to adjust or for you to take it over entirely.
