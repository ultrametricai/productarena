# The Gift List — PRs we intend to offer to public repos

**Status: everything here is a draft awaiting founder sign-off. Nothing has been posted,
opened, or sent anywhere.** All external checks were read-only (HTTP GETs, GitHub API reads,
and the keyless `productarena certify` suite, which POSTs only a JSON-RPC `initialize`
handshake to candidate MCP endpoints — the same probe the pipeline runs).

## The thesis

We find a real gap in our own evidence (missing llms.txt, no OpenAPI at a conventional path,
no MCP endpoint), and we **give the fix** as a ready-to-merge PR: genuinely useful to the
project, distribution for us on merge, and a score that honestly improves because the surface
actually improved. Template: the Gitea llms.txt draft (`drafts/outreach/gitea/`).

Two gift shapes, from the two source audits:

- **llms.txt gifts** (fleet verdicts: OSS products with `agentic-agent-docs: none`) — one
  static file in the project's docs tree, effort S, high acceptance.
- **conventional-path OpenAPI gifts** (certification near-misses: products passing everything
  except the `mcp`-or-`openapi` leg) — one served spec file, effort M, flips a certification
  level, not just a verdict.

Ranking = acceptance likelihood × visibility × score impact. All facts re-verified live on
**2026-09-11** unless noted; per-vendor verification logs live in each draft's `NOTES.md`.

## Status changes discovered during re-verification (honesty section)

- **linear**: the audit's "llms.txt returns HTML — one file from certified" is **stale**.
  `linear.app/llms.txt` now returns 200 `text/plain` (10,119 bytes); our certify re-run earns
  **Certified Agent-Ready** (4 pass / 1 fail / 1 skip — report committed at
  `drafts/outreach/linear/cert-report.json`). The gift became the certification itself; see
  the draft.
- **cline**: `docs.cline.bot/llms.txt` now returns 200 `text/plain` (18,660 bytes) — our
  `agentic-agent-docs: none` verdict (ai-coding) is stale. Not a gift; queue a re-judge.
- **shopify**: `shopify.dev/llms.txt` 301s to `shopify.dev/llms.md`, which 404s — a *broken
  redirect*, more actionable than the plain 404 the audit recorded.

## The ranked list

| # | Product (arena, rank by Arena Score) | Target repo (activity, license) | The exact gift | Flips (story id: current verdict) | Effort | Risk / policy notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | linear (project-management, 2/6 @ 36.9) | github.com/linear/linear (issues on, pushed 2026-09-09, MIT) | **Issue, not PR** (docs source closed): passing Agent-Ready cert report + invitation to submit; suggest SDL at a stable URL for Agent-Native | certifications.json: eligible `agent-ready` entry; `agentic-agent-docs`: partial (re-judge → full); `api-machine-spec`: none (if SDL ships) | S | None — congratulation + gift; report attached, zero work for them |
| 2 | vllm (local-llm-runtimes, 2/7 @ 28.9) | vllm-project/vllm (pushed 2026-09-11, Apache-2.0, 91.5k★) | `docs/llms.txt` (MkDocs passthrough; RTD root-serves default-version files — verified via docs.readthedocs.com/llms.txt 200) | `agentic-agent-docs`: none | S | **DCO sign-off enforced** (verified on merged PR #56499); RTD root-serving caveat noted in PR body |
| 3 | crawl4ai (web-scraping, 4/6 @ 30.7) | unclecode/crawl4ai (pushed 2026-09-09, Apache-2.0, 82.2k★) | `docs/md_v2/llms.txt` (mkdocs `docs_dir`, site_url = docs.crawl4ai.com) | `agentic-agent-docs`: none | S | No CLA/DCO found; single-lead maintainer; they asked for this themselves (#326) and ship an llms.txt generator app |
| 4 | homebrew (package-managers, 3/6 @ 28.2) | Homebrew/brew (pushed 2026-09-11, BSD-2-Clause, 49.5k★) | `docs/llms.txt` (Jekyll passthrough — `docs/robots.txt` precedent serves at docs.brew.sh/robots.txt, verified 200) | `agentic-agent-docs`: none | S | **Responsible AI Usage policy** — must disclose AI assistance (draft does); scope-conscious maintainers |
| 5 | docusaurus (docs-platforms, 3/5 @ 31.8) | facebook/docusaurus (pushed 2026-09-11, MIT, 66.2k★) | `website/static/llms.txt` for docusaurus.io (static root-serving verified via `_headers` etc.) | `agentic-agent-docs`: none | S | **Meta CLA required**; core llms-txt plugin was declined (PR #11420 closed) — draft is explicitly content-not-plugin and pre-concedes the "use a community plugin" close |
| 6 | langfuse (llm-evals-observability, 4/7 @ 33.8) | langfuse/langfuse-docs (pushed 2026-09-11, MIT) + langfuse/langfuse | Serve their existing fern-generated spec (cloud.langfuse.com/generated/api/openapi.yml, 200, 495KB) as JSON at langfuse.com/openapi.json (fern JSON output + Next.js rewrite) | `api-machine-spec`: none; **certification: none → agent-ready** (suite passes all but openapi/mcp, verified 2026-09-11) | M | Two-repo change; spec is generated — PR must wire generation, not commit a copy that rots |
| 7 | trivy (security-scanners, 2/5 @ 29.5) | aquasecurity/trivy (pushed 2026-09-11, Apache-2.0, 37.9k★) | `docs/llms.txt` via MkDocs — **but** trivy.dev serves docs under /docs/latest/ (mike versioning); root placement needs the website repo — confirm before drafting | `agentic-agent-docs`: none (`agentic-mcp-server` already full) | M | Root-vs-versioned placement unverified; Aqua repo conventions to check |
| 8 | opentofu (infra-as-code, 2/4 @ 30.2) | opentofu/opentofu.org (pushed 2026-09-07, Apache-2.0) | `static/llms.txt` (Docusaurus site repo → opentofu.org/llms.txt) | `agentic-agent-docs`: none | S | LF project — check DCO; low-traffic site repo, may route to core team |
| 9 | mastra (agent-frameworks, 8/9 @ 26.6) | mastra-ai/mastra (pushed 2026-09-11, 27.9k★, license NOASSERTION) | Publish the mastra dev-server's OpenAPI document at mastra.ai/openapi.json (docs app lives in the monorepo) | `api-machine-spec`: none; **certification: none → agent-ready** (fails only openapi/mcp, verified 2026-09-11) | M | License is non-standard (verify Elastic-style terms + CLA before contributing); spec source needs locating in monorepo |
| 10 | shopify (ecommerce-platforms, 2/5 @ 36) | Closed docs — **issue/report via shopify.dev feedback or github.com/Shopify/hydrogen-adjacent channels** | Bug report: shopify.dev/llms.txt 301 → /llms.md → 404 (broken redirect, verified 2026-09-11); shopify.com/llms.txt works (200) | `agentic-agent-docs`: full q8 already (shopify.com); fixing shopify.dev strengthens it; cert llms-txt: fail → pass | S | Not a PR (source closed); a concrete broken-redirect report is low-friction and hard to resent |
| 11 | localai (local-llm-runtimes, 1/7 @ 31.7) | mudler/LocalAI (pushed 2026-09-11, MIT, 49k★) | llms.txt in the Hugo docs tree (docs/content) → localai.io/llms.txt | `agentic-agent-docs`: none (`agentic-mcp-server` already full) | S | Verify Hugo static placement in their netlify build; friendly solo-led project |
| 12 | gitea (code-hosting, 2/4 @ 28.4) | gitea.com/gitea/docs PR or go-gitea/gitea issue | Already drafted: `drafts/outreach/gitea/llms.txt` (89 URLs verified 200 on 2026-09-08; docs.gitea.com/llms.txt re-verified 404 on 2026-09-11) | `agentic-agent-docs`: none; `api-machine-spec`: none | S | The template draft — ready first |
| 13 | meltano (data-pipelines, 4/5 @ 28) | meltano/meltano (pushed 2026-09-11, MIT) | llms.txt in the Docusaurus docs tree → docs.meltano.com/llms.txt | `agentic-agent-docs`: none | S | Verify docs dir location in monorepo; small friendly team |
| 14 | pnpm (package-managers, 5/6 @ 25.7) | pnpm/pnpm.io (pushed 2026-09-10, MIT) | `static/llms.txt` (Docusaurus) → pnpm.io/llms.txt | `agentic-agent-docs`: none | S | None found; small site repo, fast merges |
| 15 | keycloak (auth-platforms, 5/5 @ 22.2) | keycloak/keycloak-web (pushed 2026-09-11, Apache-2.0) | llms.txt at keycloak.org root (site repo) | `agentic-agent-docs`: none (`api-machine-spec` already partial) | S/M | CNCF project — DCO; docs are split across keycloak.org/documentation, curation is harder |
| 16 | airbyte (data-pipelines, 2/5 @ 39) | airbytehq/airbyte (pushed 2026-09-11, license NOASSERTION/ELv2 mix) | Serve their public-API OpenAPI at docs.airbyte.com/openapi.json (Docusaurus static) | `api-machine-spec`: partial; **certification: fails only openapi/mcp** (verified 2026-09-11) | M | **Airbyte CLA**; must locate the canonical public-API spec file first (api.airbyte.com answers structured JSON 401s) |
| 17 | nix docs (package-managers, 6/6 @ 22.8) | NixOS/nix.dev (pushed 2026-09-08, CC-BY-SA-4.0) | llms.txt via Sphinx `html_extra_path` → nix.dev/llms.txt | `agentic-agent-docs`: none | M | Sphinx config change + file; Nix community review culture is thorough/slow |
| 18 | ros2 (robotics-platforms, 2/5 @ 28.9) | ros2/ros2_documentation (pushed 2026-09-11, CC-BY-4.0) | llms.txt for docs.ros.org — but hosting is versioned (/en/jazzy/); root placement needs ROS infra team | `agentic-agent-docs`: none | M/L | DCO required (ROS 2 standard); root file needs infra buy-in, not just a docs PR |

Deliberately excluded, with reasons:

- **cline** — llms.txt already live (200, 2026-09-11); our verdict is stale. Re-judge, don't gift.
- **aider** — repo dormant (last push 2026-05-22); a gift PR would sit unreviewed.
- **autogen** — effectively frozen (last push 2026-04-15) + Microsoft CLA; docs are legacy.
- **logseq** — docs are a published Logseq graph (no clean sitemap to draft from honestly);
  project mid database-rewrite. Same rationale as the original Gitea selection notes.
- **plausible** — the docs repo can only serve under plausible.io/docs/; a root llms.txt needs
  an app change in plausible/analytics. Revisit as an issue, not a PR.
- **dagster / dlt / modal** — certification near-misses, but: dagster and dlt have no
  conventional REST spec to serve (GraphQL / library), and modal's docs source is closed.
  Modal is a candidate for a Linear-style *issue* if the program expands; dagster's honest
  path is an SDL-at-a-URL conversation like Linear's.
- **kitty / alacritty / wezterm / iterm2 / ghostty** — small-team terminal projects with
  drive-by-averse cultures and low score leverage; not worth the goodwill risk this round.

## Top 5 — full drafts in this directory

| Draft | Artifact | URLs verified |
| --- | --- | --- |
| [linear](./linear/) | `cert-report.json` (passing Agent-Ready run, 2026-09-11) + `issue-body.md` + `NOTES.md` | suite: 4 pass / 1 fail / 1 skip |
| [vllm](./vllm/) | `llms.txt` (50 links) + `PR.md` + `NOTES.md` | 50/50 HTTP 200, 2026-09-11 |
| [crawl4ai](./crawl4ai/) | `llms.txt` (49 links) + `PR.md` + `NOTES.md` | 49/49 HTTP 200, 2026-09-11 |
| [homebrew](./homebrew/) | `llms.txt` (49 links) + `PR.md` + `NOTES.md` | 49/49 HTTP 200, 2026-09-11 |
| [docusaurus](./docusaurus/) | `llms.txt` (54 links) + `PR.md` + `NOTES.md` | 54/54 HTTP 200, 2026-09-11 |

## Rules of engagement (apply to every gift)

1. **Human sends, one at a time**, from a personal account; space them out; never batch-open.
2. Re-verify the gap and re-run the URL 200-check the day of sending (surfaces move — Linear
   and cline both flipped between audit and this list).
3. Check for competing PRs/issues immediately before opening (dedupe searches in NOTES were
   run 2026-09-11 and go stale).
4. Follow each repo's contribution policy exactly: DCO sign-offs where required, CLAs signed
   first, AI-assistance disclosed where a policy exists (Homebrew explicitly).
5. Gift-first tone per the Gitea template: no expectation, provenance link, explicit
   easy-close invitation. Never mention scores changing — the provenance link is enough.
6. After a merge: wait for the surface to go live, then re-probe and re-judge only the
   affected story (`judge --category X --product Y`), citing the live probe — same lane as any
   community contest.
