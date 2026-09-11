# Gift draft: vLLM llms.txt — maintainer review notes

**Status: draft. Nothing has been posted anywhere.** These files exist for a human to review,
edit, and send (or discard).

## Why vLLM

- **Highest-visibility OSS gap on our books**: vllm-project/vllm has 91,512 stars (checked
  2026-09-11), pushed the same day, with community PRs merging hourly. Our committed verdict
  (`data/local-llm-runtimes/verdicts.json`) records `agentic-agent-docs: none` for vllm, and
  vllm sits #2 of 7 in local-llm-runtimes (Arena Score 28.9) — this is one of its few `none`
  axes.
- **Genuinely useful**: vLLM is the thing people point coding agents at ("deploy vLLM on k8s",
  "tune gpu-memory-utilization") and its docs are large (2,638 sitemap URLs) and versioned —
  exactly the case llms.txt exists for.
- **Contribution-friendly**: routine community docs PRs; CONTRIBUTING.md present; Apache-2.0.

## Verification log (all read-only, 2026-09-11)

- `https://docs.vllm.ai/llms.txt` → HTTP 404 (text/html) — the gap is live.
- `https://docs.vllm.ai/` → 200, final URL `/en/latest/` (Read the Docs, default version
  `latest`).
- `https://docs.vllm.ai/sitemap.xml` → 200 (2,638 URLs; 2,322 are API reference pages).
- Repo layout: `mkdocs.yaml` at repo root, content in `docs/` (checked via GitHub contents
  API) — non-markdown files in `docs/` pass through to the build.
- Root-serving mechanism: Read the Docs serves root files from the default version's build
  root — verified by `https://docs.readthedocs.com/llms.txt` → 200 text/plain (RTD's own
  RTD-hosted docs). Honest caveat: if vLLM's RTD config doesn't root-serve it, the file still
  lands at `/en/latest/llms.txt`; the PR body says so.
- Certify suite run 2026-09-11: `docs.vllm.ai` fails `llms-txt` (and openapi/mcp); passes
  robots. llms.txt is the first step toward any certification level.
- **Every URL in the drafted `llms.txt` verified HTTP 200 on 2026-09-11 (50/50, including the
  four Optional links).** One draft URL (`/design/`) returned 302 → contributing/ and was
  replaced before finalizing.
- DCO: the DCO status check is enforced on vLLM PRs (verified on merged PR #56499). The human
  submitting must commit with `-s`.

## What it flips on our side

- `local-llm-runtimes` / `vllm` / `agentic-agent-docs`: currently `none` → re-judge after the
  file is live (probe `llms-txt` turns positive).
- Certification: llms.txt is 1 of the 3 required Agent-Ready checks (llms-txt + mcp-or-openapi
  + robots); vllm currently passes only robots.

## Risks / etiquette

- DCO sign-off required (`git commit -s`) — enforced CI check.
- vLLM moves fast; docs URLs churn. The PR body dates the 200-check so reviewers know its
  freshness.
- No existing llms.txt issue/PR found in vllm-project/vllm (gh search, 2026-09-11).

## Review checklist before sending

1. Re-run the URL 200-check (`scripts` used a plain curl loop; any tool works).
2. Re-check for a competing llms.txt PR/issue in vllm-project/vllm.
3. Commit with DCO sign-off; disclose AI assistance if vLLM's contributing guide asks.
