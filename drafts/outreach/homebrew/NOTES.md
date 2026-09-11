# Gift draft: Homebrew llms.txt — maintainer review notes

**Status: draft. Nothing has been posted anywhere.** These files exist for a human to review,
edit, and send (or discard).

## Why Homebrew

- **Enormous reach, tiny change**: Homebrew/brew has 49,490 stars (checked 2026-09-11) and
  docs.brew.sh is one of the most-consulted developer doc sites anywhere. The mechanism is
  proven in-repo: `docs/robots.txt` already passes through Jekyll to
  https://docs.brew.sh/robots.txt (verified 200).
- **They're already agent-curious**: the docs include an MCP Server page
  (docs.brew.sh/MCP-Server) — llms.txt is the natural companion, and our verdicts record
  `agentic-mcp-server` positive signals alongside `agentic-agent-docs: none`.
- **Our evidence**: `data/package-managers/verdicts.json` records `agentic-agent-docs: none`
  and `api-machine-spec: none` for homebrew; it ranks 3/6 in package-managers (Arena Score
  28.2).

## Verification log (all read-only, 2026-09-11)

- `https://docs.brew.sh/llms.txt` → HTTP 404 (text/html) — the gap is live.
- `https://docs.brew.sh/robots.txt` → 200 text/plain — static passthrough from `docs/` works.
- `https://docs.brew.sh/sitemap.xml` → 200 (1,619 URLs; ~80 real doc pages + ~1,500 rubydoc
  pages + 9 manpage variants — the draft links the ~49 that matter plus the rubydoc index).
- Repo layout: `docs/` contains `_config.yml`, `Gemfile`, `CNAME`, `robots.txt` (GitHub
  contents API) — docs.brew.sh is Jekyll built from `docs/`.
- Dedupe: no llms.txt issue or PR found in Homebrew/brew (gh search, 2026-09-11).
- **Every URL in the drafted `llms.txt` verified HTTP 200 on 2026-09-11 (49/49, including the
  four Optional links).** One draft URL initially used the legacy `Tips-N'-Tricks` slug; it
  was corrected to `Tips-and-Tricks` (the sitemap slug) before verification.
- No CLA/DCO found in CONTRIBUTING.md; PR checklist asks for `brew style` /`brew tests` where
  relevant (not applicable to a static docs file).

## What it flips on our side

- `package-managers` / `homebrew` / `agentic-agent-docs`: currently `none` → re-judge once
  live.
- Certification: homebrew would then pass llms-txt; remaining Agent-Ready gap is MCP-endpoint
  or OpenAPI (the brew MCP server is local/stdio, so the docs-origin MCP check won't pass — a
  fact worth an honest note if certification ever comes up with them).

## Risks / etiquette

- **Responsible AI Usage policy** (docs.brew.sh/Responsible-AI-Usage): Homebrew explicitly
  regulates AI-assisted contributions. The PR body discloses AI assistance up front; the
  submitting human must read the policy first and be ready to own every line.
- Homebrew maintainers keep tight scope on `docs/`; they may prefer different curation (e.g.
  dropping governance pages). Easy-close framing + "take it over entirely" covers this.

## Review checklist before sending

1. Read docs.brew.sh/Responsible-AI-Usage and comply (disclosure sentence is already in the
   draft body).
2. Re-run the URL 200-check.
3. Re-check for a competing llms.txt PR/issue.
