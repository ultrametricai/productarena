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

## Post-send compliance audit (2026-09-15, gift-quality-pass lane)

PR #56909 state: **OPEN**, no maintainer comments yet, DCO check **passing**, template
sections (Purpose / Test Plan / Test Result) present. Two findings:

1. **AGENTS.md violation — must fix.** vllm-project/vllm's `AGENTS.md` ("Agent Instructions
   for vLLM", applies to *all* AI-assisted contributions, "Breaching these guidelines can
   result in automatic banning") requires that PR descriptions for AI-assisted work include:
   - Why this is not duplicating an existing PR — **missing from our body**.
   - Test commands run and results — present.
   - Model evaluation results when output/accuracy/serving is affected — N/A (docs-only),
     but the body should say so explicitly.
   - **A clear statement that AI assistance was used — missing from our body.**

   Fix drafted: `PR-BODY-v2.md` in this directory adds an "AI-assistance disclosure (per
   AGENTS.md)" section (AI-drafted, human-reviewed and accountable, disclosed), an explicit
   dedupe statement (re-verified 2026-09-15: `gh pr list --state all --search "llms.txt"` →
   only #56909; `gh issue list --state all --search "llms.txt"` → no llms.txt issue), and an
   explicit model-eval N/A line. Command for the founder (do not post from this lane):

   ```
   gh pr edit 56909 --repo vllm-project/vllm \
     --body-file drafts/outreach/vllm/PR-BODY-v2.md
   ```

   Optionally follow with a short transparency comment so the edit is visible:

   ```
   gh pr comment 56909 --repo vllm-project/vllm --body \
   "Updated the description to comply with AGENTS.md: added the AI-assistance disclosure \
   (the llms.txt and this description were AI-drafted; I reviewed every line, ran the link \
   verification, and am accountable for the change), the duplicate-work check, and an \
   explicit note that model-evaluation results are N/A for a docs-only static file."
   ```

2. **pre-run-check CI failure is expected, not actionable.** The failing check only gates
   pre-commit runs: it requires a `ready`/`verified` label or 4+ merged PRs from the author,
   and says "DO NOT request for the label to be added if you are an AI agent." Do NOT ask for
   the label; a reviewer adds it when they pick the PR up. Docs-only file needs no CI anyway.
