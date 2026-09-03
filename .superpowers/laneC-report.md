# Lane C report — accuracy wave 2

Scope: `ai-coding`, `code-hosting`, `startup-banking` + install-command alternates (cross-category).

## Commits

- `dbe84d1` — "Resolve accuracy-wave-2 contest issues for ai-coding/code-hosting/startup-banking" (385 files: evidence/products/rankings/verdicts for the 3 in-scope categories, judge cache, community seeds, README stats).

## Issue outcomes

| # | Issue | Outcome | Why |
|---|---|---|---|
| 3 | claude-code api-key-auth | **fixed** → `full` q9 | `ANTHROPIC_API_KEY`/`X-Api-Key` quote verified live at code.claude.com/docs/en/iam |
| 4 | claude-code enterprise-grade-auth | **fixed** → `full` q8 | SSO/domain-capture quotes verified live (code.claude.com/docs/en/iam + claude.com/solutions/enterprise) |
| 5 | codex agentic-scoped-keys | **fixed** → `partial` q3 | RBAC verified via developers.openai.com mirror (platform.openai.com 403s bots); no Codex-specific scoped-cred mechanism found, so partial not full |
| 6 | codex api-machine-spec | **fixed** → `full` q7 | openai-openapi repo (OpenAPI 3.1) verified live |
| 7 | codex api-interactive-docs | **fixed** → `partial` q4 | per-language runnable examples verified via developers.openai.com mirror; general OpenAI ref, not Codex-branded, so partial |
| 8 | github agentic-scoped-keys | **fixed** → `full` q7 | fine-grained PAT permissions quote verified live, picked up cleanly by automated extract |
| 9 | linear/relay/ramp zero-community | **partial — kept open** | ramp + relay fixed (5 community items each, was 0); linear is project-management, out of Lane C scope |
| 10 | a-shell missing logo | **untouched** | mobile-dev, out of Lane C scope — left for owning lane |

## Boundary rule adopted

A product's `urls.docs`/`urls.site`/`urls.github` (plus pages its own docs explicitly link to for auth/API management) define its in-scope evidence surface. Codex's `urls.docs` in `products.json` is literally `platform.openai.com/docs/codex` — so OpenAI's platform docs (RBAC, openai-openapi, API reference) are in-scope for Codex's api-*/agentic-scoped-keys stories, the same way `code.claude.com/docs` + `claude.com/solutions/enterprise` are in-scope for Claude Code's auth stories (#3/#4). Applied identically both directions — no special-casing either product. Where `platform.openai.com/*` 403'd automated fetch (confirmed, matches the issues' own caveats), used the accessible `developers.openai.com/api/docs/*` mirror (verified identical content) instead of trusting the issue's URL blind.

## Score deltas (coverage score / INIT aiEra)

- claude-code: 36.2 → 43.9 (aiEra 31.1 → 39.4)
- codex: 30.8 → 32.5 (aiEra 24.5 → 32.0)
- github: 28.0 → 30.0 (aiEra 27.6 → 31.2)
- ramp: 25.9 → 28.3 (aiEra 29.5 → 30.6)
- relay: 19.9 → 21.5 (aiEra 5.3 → 4.7)

## Churn audit

Adding evidence forces a full per-product re-judge (all cells, not just the targeted story). Diffed every cell against a pre-session backup of `verdicts.json`; reverted cells whose verdict/quality changed **without** citing any newly-added evidence id (pure re-roll noise), including two na↔none applicability flips. Reverted: 21 claude-code/codex cells, 15 github cells, 17 ramp/relay cells (53 total). Verified stability by re-running `judge` afterward — zero re-judging triggered (cache hits), confirming the patched cache hashes are consistent with current evidence.

## Install alternates added (cross-category)

- cloudflare: + pnpm, yarn, bun (wrangler) — 4 total
- railway: + curl (agents.railway.com), brew, scoop — 4 total
- cursor: + PowerShell/irm (Windows) — 2 total
- ramp: + brew, uv tool install — 3 total
- gitea: + brew — 2 total

All verified against live official docs/repos (curl 200 + exact quote match) before adding.

## Gates

- `pnpm stats` (recompute): OK — 10 arenas, 53 products, 3881 verdicts.
- `pnpm test`: OK — 34 files, 276 tests passed.
- `pnpm build`: OK — compiled, 372 static pages generated.

## Concerns / notes for controller

- Issue #9 stays open pending the `linear` (project-management) portion — another lane's responsibility.
- Issue #10 (a-shell logo, mobile-dev) untouched — out of scope for this lane.
- HN rate-limited my `curl` probing twice mid-session (429/"Sorry."); waited it out before re-verifying seed URLs and running `collect-community` — no evidence was added without a successful live fetch.
- codex's `agentic-scoped-keys` and `api-interactive-docs` landed as `partial` rather than `full` — the evidence genuinely supports OpenAI-platform-level capability but not a Codex-specific implementation, so I did not inflate to `full`.
