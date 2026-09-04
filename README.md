# ProductArena (ultrametric.ai/productarena)

*(formerly Product Arena)*

**Evidence in, rankings out.** ProductArena scores how AI-ready real products are — every verdict
cites the evidence behind it, nothing is opinion.

[![CI](https://github.com/ultrametricai/productarena/actions/workflows/ci.yml/badge.svg)](https://github.com/ultrametricai/productarena/actions/workflows/ci.yml)
[![site](https://img.shields.io/badge/site-ultrametric.ai%2Fproductarena-000000)](https://ultrametric.ai/productarena)

![ProductArena](https://ultrametric.ai/productarena/opengraph-image)

ProductArena is an evidence-based comparison site: evidence in, rankings out. For each of ten-plus
product arenas (50+ products and growing) we crawl vendor docs, GitHub, and community sources,
extract per-product evidence, and
have an LLM judge every product against a shared set of user stories. The result is a
leaderboard, a head-to-head battle log, a per-product story matrix, and — across every arena —
a global Agentic Index ranking how AI-ready every product is. Every score traces back to cited
evidence, not opinion.

Live site: https://ultrametric.ai/productarena

<!-- stats:start -->
As of the last full pipeline run: **29 arenas, 139 products, 9,028 judged verdicts.**
<!-- stats:end -->

Arena, product, and verdict counts above are regenerated from data/ by `pnpm stats` —
never a hand-maintained claim; see "Status & roadmap" for what's next.

## The rankings, at a glance

![ProductArena rankings — homepage snapshot](docs/assets/rankings-snapshot.png)

*Snapshot from September 4, 2026 (29 arenas, judge v3) — rankings move whenever new evidence lands, so treat every
number in this image as historical. The live table is at
[ultrametric.ai/productarena](https://ultrametric.ai/productarena); machine-readable rankings
are at `/data/<arena>/rankings.json` per arena.*

## Quickstart

**I want to contribute (fix a verdict, add evidence, add a product):**

```bash
git clone https://github.com/ultrametricai/productarena.git && cd productarena
pnpm install
pnpm dev        # http://localhost:3000
pnpm test
```

Then see [CONTRIBUTING.md](./CONTRIBUTING.md) — contesting a verdict or adding evidence is a
first-class workflow, not a favor.

**I want to consume the data (curl or an agent via MCP):**

```bash
curl https://ultrametric.ai/productarena/data/categories.json
curl https://ultrametric.ai/productarena/data/ai-coding/rankings.json
curl https://ultrametric.ai/productarena/llms.txt          # index for agents
```

Or wire it into an MCP client:

```json
{
  "mcpServers": {
    "productarena": {
      "command": "node",
      "args": ["/absolute/path/to/productarena/mcp/dist/index.js"]
    }
  }
}
```

See [`mcp/README.md`](./mcp/README.md) for the full tool list and setup.

**I want to contest a verdict (I think a score is wrong):**

Every verdict on the site has a "⚑ contest" link that opens a prefilled issue. Or file one
directly: [new contest-verdict issue](https://github.com/ultrametricai/productarena/issues/new?template=contest-verdict.yml) —
cite the evidence URL and quote the relevant excerpt so a maintainer can verify it.

## How it fits together

```
 crawl → extract → normalize → collect-community → probe → judge → derive
   │         │          │              │              │        │       │
   └── vendor/GitHub/community pages ──┴── evidence ───┴────────┴── rankings.json
                                                                        │
                                                                        ▼
                                                data/{category}/*.json  (checked in)
                                                        │
                                        ┌───────────────┼────────────────┐
                                        ▼               ▼                ▼
                                  static site      /data JSON API   MCP server
                                  ultrametric.ai/productarena + llms.md/txt (mcp/)
                                                     + /openapi.json
```

## The arenas

<!-- arenas:start -->
| Arena | Products |
|---|---|
| Desktop OS (`desktop-os`) | macos, omarchy, ubuntu, fedora, windows |
| Startup Banking (`startup-banking`) | mercury, brex, ramp, wise, relay |
| Project Management (`project-management`) | linear, asana, clickup, notion, monday, jira |
| Web Scraping APIs (`web-scraping`) | firecrawl, crawl4ai, jina-reader, apify, scrapingbee, browserbase |
| Mobile AI Dev Tools (`mobile-dev`) | termius, tailscale, blink-shell, a-shell, working-copy, github-mobile |
| Code Hosting (`code-hosting`) | github, gitlab, bitbucket, gitea |
| AI Coding Agents (`ai-coding`) | codex, claude-code, cursor, github-copilot, gemini-cli |
| Edge & App Platforms (`edge-platforms`) | cloudflare, vercel, netlify, fly-io, railway, render |
| Frontend Frameworks (`frontend-frameworks`) | react, vue, svelte, angular, solid |
| Local LLM Runtimes (`local-llm-runtimes`) | ollama, llama-cpp, vllm, lm-studio, jan |
| Payroll & HR Ops (`payroll`) | gusto, rippling, deel, justworks |
| Product Feedback & Intent (`product-feedback`) | canny, featurebase, productboard |
| Software Factory (`software-factory`) | foreloop, factory, devin, openhands, codegen, jules |
| Mobile & In-Person Payments (`mobile-payments`) | stripe-terminal, square, sumup, adyen-pos |
| API platforms (`api-platforms`) | postman, kong, bruno, hoppscotch |
| Team Chat (`team-chat`) | slack, discord, ms-teams, zulip |
| Backend as a Service (`backend-as-a-service`) | supabase, firebase, convex, appwrite |
| Online Payments (`payments`) | stripe, adyen, paypal, square |
| Accounting & Bookkeeping (`accounting`) | quickbooks, xero, puzzle, pilot |
| Security Scanners (`security-scanners`) | trufflehog, semgrep, snyk, gitleaks, trivy |
| Infrastructure as Code (`infra-as-code`) | terraform, pulumi, opentofu, crossplane |
| Vibe-Coding App Builders (`vibe-coding`) | lovable, bolt, v0, replit, base44 |
| Model Gateways & Routers (`model-gateways`) | openrouter, litellm, portkey, vercel-ai-gateway, cloudflare-ai-gateway |
| LLM Evals & Observability (`llm-evals-observability`) | langfuse, langsmith, braintrust, arize-phoenix, wandb-weave, helicone |
| AI Search APIs (`ai-search-apis`) | exa, tavily, perplexity-sonar, brave-search-api, serpapi |
| Agent Frameworks & SDKs (`agent-frameworks`) | langgraph, openai-agents, claude-agent-sdk, crewai, pydantic-ai, mastra |
| Agent Sandboxes & Code Execution (`agent-sandboxes`) | e2b, daytona, modal, cloudflare-sandbox, vercel-sandbox |
| Product Analytics (`product-analytics`) | posthog, amplitude, mixpanel, plausible |
| CRM (`crm`) | hubspot, attio, salesforce, twenty |
<!-- arenas:end -->

Regenerated by `pnpm stats` — never hand-edited. …and growing — see the live site for the current set.

See `data/categories.json` for each arena's full description, personas, and themes.

## Methodology

New to the site and just want plain-language answers ("what does `na` mean," "why does this
score look low," "how do I disagree")? See **[docs/SCORING.md](./docs/SCORING.md)** — a
one-page, jargon-free companion to the technical writeup below.

### 1. Evidence tiers

Every claim about a product is backed by an **evidence** item with one of four tiers:

- `claimed-docs` — vendor site/docs/changelog copy (what the vendor says about itself)
- `github` — README/repo content
- `community` — independent community sources (forums, reviews, social posts)
- `probe` — direct, hands-on observation of the product

Evidence is stored per product at `data/{category}/evidence/{product}.json`, each item with
a stable id, tier, source URL, verbatim excerpt, and fetch timestamp.

#### Evidence-strength ladder

Tiers aren't just labels — they're ranked, strongest first:

**`probe` (tested) > `github` (code) > `community` (independent) > `claimed-docs` (vendor claim)**

A direct, hands-on probe of the product (see "Probe harness" below) outranks a GitHub
README, which outranks independent community commentary, which outranks the vendor simply
describing its own product. `lib/verification.ts`'s `strongestEvidence()` walks a verdict's
cited evidence down this ladder and returns the single best-supported item — that's the
source behind every "proof ↗" link on the site (product page verdict rows, story matrix
cells, and battle round cards). It's a different, finer-grained ranking than the coarser
`verificationLevel` badge (`tested`/`corroborated`/`vendor-claim`/`disputed`), which groups
`github` in with `claimed-docs` for display purposes; `strongestEvidence` keeps them distinct
so the proof link always points at the most credible single source, not just the highest
badge tier.

#### Probe harness

`pnpm pipeline probe` runs a small set of keyless, hands-on checks per product and turns each
*definitive* result — positive or negative — into a `probe`-tier evidence item (ambiguous
results, e.g. a 403 from a WAF, produce no item rather than a guess): whether `/llms.txt`
resolves, whether the docs URL serves a `.md` variant, whether a conventional OpenAPI spec
path resolves, and whether the curated `links.mcp`/`links.cli` URLs are live. See
`pipeline/stages/probe.ts` (`runProbeChecks`) for the exact rules and
`pipeline/__tests__/probe.test.ts` for coverage with a mocked fetcher (no live network calls
in tests). Like `collect-community`, re-running `probe` for a product replaces only its prior
`probe`-tier items — other tiers are untouched.

### 2. Judged cells

For every (product, story) pair, an LLM judge reads only that product's evidence pack for
that story and returns a **verdict**:

| Verdict | Meaning |
|---|---|
| `full` | Clearly delivers the story |
| `partial` | Delivers, with significant caveats or extra tooling required |
| `disputed` | Vendor claims it, but community/hands-on evidence contradicts — must cite both sides |
| `none` | No evidence it delivers (never used for capabilities that don't apply — see `na`) |
| `na` | The story's axis doesn't apply to this product at all (wrong-axis, e.g. an OS-install story for a SaaS API) |

Each verdict also carries a `quality` score (0–10, how *well* it delivers — 0 for `none`/`na`),
a `confidence` level, a short rationale, and the specific `evidenceIds` the judge relied on.
The judge is instructed to use **only** the evidence pack, never outside/training knowledge —
absence of evidence for a well-known capability still yields `none`, not a guess.

Verdicts are cached and keyed on a hash of `(storyId, story title, evidence ids+excerpts,
prompt version)`, so re-running `judge` is a no-op unless the story or evidence actually
changed.

#### Judge model & prompt version

The judge is an Anthropic model — `claude-sonnet-5` by default, overridable via the
`PA_MODEL` env var (`pipeline/llm.ts`) — driven by a versioned system prompt in
`pipeline/stages/judge.ts` (`PROMPT_VERSION`, currently **`v3`**). Because the prompt
version is part of every cell's cache key, bumping it deliberately invalidates all cached
verdicts, so a prompt change is always followed by a full re-judge rather than mixing
verdicts from different prompt generations.

What each version added:

- `v2` — evidence-only judging (no training knowledge), `na` wrong-axis tier, disputed
  requires citations from two distinct evidence tiers.
- `v3` — three calibration fixes, each traceable to an audited defect:
  1. **`na` vs `none` decision procedure** with few-shot boundary examples (applicability is
     decided *before* looking at evidence; lack of evidence for an applicable axis is always
     `none`).
  2. **Explicit 0–10 quality rubric**, plus a hard requirement that any quality below 10
     names its gap in the rationale (`"missing for 10: …"`) — mechanically enforced by
     `validateVerdictRules`, which rejects sub-10 `full`/`partial` verdicts missing the
     clause.
  3. **Evidence-relevance rule**: a citation may only support or undermine a verdict if its
     content is *about the story's subject* — off-topic negative sentiment (e.g. unrelated
     security news) must not move a verdict or appear in the rationale.

Calibration is gated by `pnpm calibrate` (`pipeline/scripts/calibration-check.ts`), which
re-runs the live judge against a hand-verified golden-cell set
(`pipeline/golden/golden-cells.json`) and fails on more than 2 tier mismatches.

### 3. Scoring formula

A cell's score is `story.weight × quality × verdictFactor`, where the verdict factor is
`full=1.0, partial=0.6, disputed=0.3, none=0, na=excluded`. A product's overall score (and
each per-theme score) is the weighted percentage across all **applicable** (non-`na`) cells:

```
score = 100 × Σ(cellScore) / Σ(story.weight × 10)   — over non-na cells only
```

`na` cells are excluded from both numerator and denominator entirely — they neither help nor
hurt a product's score. Head-to-head battles use the same per-cell scores: each story is a
"round" won by whichever product scores higher on it (ties are draws, `na` rounds are
excluded), and the overall battle winner is whoever wins more story-weight.

**Important:** scores measure **evidenced story coverage**, not absolute product quality. A
product with a thin crawl (fewer/weaker evidence items) will score lower even if it's
objectively excellent — the judge can only score what's in the evidence pack. Conversely, a
wrong-axis story is marked `na` and excluded rather than counted against a product.

#### Claims vs reality — the claims-integrity index

Every product's vendor claims (extracted from its own docs/GitHub materials by
`pipeline/stages/claims.ts`) are reconciled against our judge's independent verdicts
(`lib/claims.ts`). Each claim that maps onto a story lands in one of three **testable**
buckets: *verified* (full/partial verdict backed by corroborated/tested evidence),
*unverified* (full/partial verdict, but only the vendor's own claim backs it), or
*contradicted* (verdict disputed/none/na). Claims mapping onto no story are **untestable**
(a taxonomy gap, not a mark against the product) and are excluded entirely.

The claims-integrity score (`lib/claimsIntegrity.ts`) rewards claims we independently
verified and actively penalizes ones the evidence contradicts:

```
testable  = verified + unverified + contradicted        — untestable claims excluded
integrity = 100 × max(0, verified − 2 × contradicted) / testable
```

Verified claims count fully, unverified claims count for nothing (they only inflate the
denominator), and each contradicted claim cancels **two** verified ones — overpromising is
worse than staying silent — with the score clamped at 0.

**Null, never zero:** a product with no claims data (or no testable claims) gets `null`,
not a fabricated `0` — same rule as every other index here: "we don't know" is not "the
worst", and nulls sort last. The full cross-arena ranking lives at
[/rankings/claims-integrity](https://ultrametric.ai/productarena/rankings/claims-integrity),
and each product page's "Claims vs evidence" section opens with its integrity summary.

### 4. The Agenticness Index

Every arena includes the same 9 canonical "agenticness" stories, injected verbatim (never
LLM-authored) so agent-readiness is comparable across categories. Defined in
`pipeline/agentic-stories.ts`:

| Story id | Story | Weight |
|---|---|---|
| `agentic-public-api` | I can drive the product through a documented public API | 3 |
| `agentic-official-cli` | I can use an official CLI | 2 |
| `agentic-mcp-server` | I can connect an agent via an official MCP server | 3 |
| `agentic-mcp-client` | I can plug MCP servers into this product so it can use their tools | 3 |
| `agentic-webhooks` | I can subscribe to events via webhooks | 2 |
| `agentic-sdks` | I can build against official SDKs | 2 |
| `agentic-agent-docs` | I can point an agent at llms.txt or agent-oriented docs | 2 |
| `agentic-scoped-keys` | I can issue scoped/least-privilege API credentials for an agent | 2 |
| `agentic-headless` | I can run the product headlessly / in CI for automation | 2 |

`agentic-mcp-server` and `agentic-mcp-client` are two ends of the same protocol, deliberately
split into separate axes: `-server` asks whether the product *ships* an MCP server for other
agents to connect to, `-client` asks whether the product itself *consumes* MCP servers. For
agent products (e.g. a coding-agent CLI), the serving axis is often the wrong question — the
product IS the agent — while the consuming axis is exactly the right one; see the applicability
notes in [METHODOLOGY.md](./METHODOLOGY.md).

A product's "agenticness" score on the leaderboard is its weighted percentage across just
these 9 cells (theme `agenticness`, group `agent-access`).

Two sibling group-scoped indexes live under the same `agenticness` theme: `agentic-features`
("does the product act agentically itself" — `agenticApp` on the leaderboard) and, since v2.4,
`api-quality` (see below).

### 5. The Arena Score (formerly the AI-Era Index)

v2.4 adds a sixth canonical group, **API quality** (theme `agenticness`, group `api-quality`),
alongside `agent-access`. Where `agent-access` asks "can an agent reach the product at all,"
`api-quality` asks "how good is that surface once an agent is there":

| Story id | Story | Weight |
|---|---|---|
| `api-interactive-docs` | I can explore an interactive API reference with runnable examples | 2 |
| `api-machine-spec` | I can download a machine-readable API spec (OpenAPI or equivalent) | 2 |
| `api-versioning-policy` | I can rely on versioned APIs with a documented deprecation policy | 2 |
| `api-sandbox` | I can test against a sandbox environment without touching production data | 1 |

On top of that, every leaderboard entry now carries an **Arena Score** (`aiEra` internally,
displayed on-site as "Arena {n}/100" — this section used to be called the "AI-Era Index," same
formula, new name) — a single
number meant to answer "how ready is this product for a world where agents, not just humans,
are the primary users?" It's a weighted blend of five existing leaderboard components:

| Component | Weight | What it measures |
|---|---|---|
| `agentReady` | 0.30 | can an agent reach the product (API/CLI/MCP/webhooks/SDKs/docs) |
| `apiQuality` | 0.20 | how good is that API surface (docs, spec, versioning, sandbox) |
| `openness` | 0.20 | can you self-host, export your data, and read the source |
| `agenticApp` | 0.15 | does the product act agentically on its own behalf |
| `automation` | 0.15 | how deep are its rules/scheduling/bulk/versioned-automation primitives |

```
aiEra = Σ(component × weight) / Σ(weight)   — over non-null components only
```

Weights are renormalized over whichever components are non-null for a given product, so a
product missing one axis (e.g. no `openness` theme applies to its category) isn't penalized
twice — once for the missing axis, once for a shrunken blend. `aiEra` is `null` only when every
component is null. The exact weights live in `AI_ERA_WEIGHTS` in `lib/scoring.ts`.

**Why lead with this instead of the coverage score.** The coverage score measures evidenced
story coverage across a product's whole category — useful, but it treats "has a nice settings
UI" the same as "has an MCP server." As of v2.4, leaderboards sort primarily by `aiEra` (nulls
last, ties broken by coverage score) because we think products in the AI era should be ranked
first by how well agents and automation can actually work with them — the coverage score is
still shown, just demoted to a secondary line.

**These weights are a starting position, not a verdict.** We picked them because agent-access
and API quality are the most direct proxies for "can an agent use this at all," while
openness/agenticApp/automation matter but are one step removed. If you think the weighting is
wrong, [contest it via an issue](./CONTRIBUTING.md) — like every verdict on this site, the
formula is open to challenge.

#### Score confidence (A–D)

Scores never pretend: untested cells can't score, and the confidence grade says how much of a
score is backed by probes. Every Arena Score badge carries a small A–D chip
(`lib/confidence.ts`) derived from two fractions over the product's applicable (non-`na`)
cells:

| Signal | Meaning |
|---|---|
| **coverage** | fraction of applicable cells whose verdict cites *any* evidence — the complement is "we found nothing either way," which already scores 0 but is unknown, not failed |
| **testedShare** | fraction whose *strongest* cited evidence is a tested tier (`probe` or `github` — hands-on runs or inspectable source), per `lib/verification.ts`'s evidence ladder |

Grades: **A** = coverage ≥ 0.85 and testedShare ≥ 0.40 · **B** = coverage ≥ 0.70 and
testedShare ≥ 0.25 · **C** = coverage ≥ 0.55 · **D** = below that. The grade never changes any
published score — two products can post the same 60 while one earned it from probes and the
other from vendor docs, and the chip is where that difference shows. Thresholds are calibrated
against the live dataset so the letters actually discriminate (see
`CONFIDENCE_THRESHOLDS`), and, like the Arena Score weights, they're open to challenge.

### 6. Story provenance

Every story in `data/{category}/stories.json` optionally carries an `origin` field
(`lib/schemas.ts`'s `StoryOriginSchema`) recording where it came from and when:

| `origin.kind` | Meaning |
|---|---|
| `canonical` | one of the 29 fixed agenticness/openness/automation-depth/privacy-posture stories (`pipeline/agentic-stories.ts`), injected verbatim into every category by `normalize.ts`'s `assembleTaxonomy` — never LLM-authored |
| `normalized` | assembled into the category's taxonomy by the LLM-driven `normalize` stage; carries the judge `promptVersion` in force at the time |
| `contest` | added or adjusted via a contest issue (not yet exercised — `contest-check.ts` only appends evidence today, never stories) |
| `manual` | hand-edited |

`origin` is additive and never participates in `cellHash` (`pipeline/stages/judge.ts`) —
stamping or backfilling it can never invalidate the judge cache or change a verdict. Hover a
story title or matrix cell on any product page to see its origin in the tooltip (e.g.
"canonical" or "normalized · v2").

### 7. Judge model and prompt version

The judge model is `claude-sonnet-5` by default (override with the `PA_MODEL` env var), and
the judge prompt is versioned (`PROMPT_VERSION = 'v2'` in `pipeline/stages/judge.ts`) — the
cache key includes the prompt version, so bumping it forces a full re-judge.

**Re-judge stability policy.** LLM judging has measurable re-roll variance (~9% of cells can
change verdict or quality on a re-judge with no relevant evidence change). To keep rankings
evidence-driven rather than noise-driven, large re-judge waves are reviewed against the prior
state and pure churn is reverted under audited rules: applicability (`na`↔`none`) never flips
without new evidence, verdicts that cite nothing new don't move close races, and negative
mechanical probe results only affect the story axis they actually test. Every revert is
recorded in the commit that applies it. A future prompt version will pass the prior verdict
as an anchor to reduce this variance at the source.

### 8. Bias disclosure — the judge is an Anthropic model

**Owner-product disclosure:** the Product Feedback & Intent arena includes Foreloop, built by
Ultrametric Inc — the company that operates ProductArena. Foreloop is judged by the identical evidence
rules as every other product (it placed third of four in its own arena as of this writing), its
product page carries an affiliation banner, and every one of its verdicts is contestable like
any other.

**Read this before trusting the `ai-coding` arena's numbers.** The judge model
(`claude-sonnet-5`) is made by Anthropic, and the `ai-coding` arena includes Anthropic's own
product, Claude Code, which leads that arena's **Arena Score** (29.5) as of v2.4 — though on
raw coverage score it now sits second (34.6) behind GitHub Copilot (35.0), a lead that flipped
when the v2.4 `api-quality` cells were added (Claude Code's own coverage score was 35.2 as of
the last full audit below, before those cells existed). This is a real conflict of interest and
we want it visible, not buried.

What we did about it:

- **We ran an adversarial bias audit** of every `claude-code` verdict scored `full` in the
  `ai-coding` arena (14 cells), checking each cited evidence excerpt against the claim it
  was used to support, and separately compared every `agentic-*` cell head-to-head against
  `codex`.
- **One cell was downgraded** as a result: `live-app-debugging` went from `full` (quality 6)
  to `partial` (quality 5) after adjudication. The sole citation was a bare, title-only doc
  fragment ("Debug live web applications | Chrome") with no scope or mechanism detail, while
  every competing product's comparable-or-better evidence for the same story capped at
  `partial`/`none`. The verdict's rationale in `data/ai-coding/verdicts.json` documents the
  downgrade and the shared-vendor conflict explicitly. This changed Claude Code's overall
  score from 35.5 to 35.2 (it remained the category leader).
- **A second adversarial review pass, run for v2.4, audited the new api-quality/agent-access
  cells** and applied two cross-vendor corrections, stated plainly in both directions:
  one **against** Claude Code's favor (`agentic-public-api` downgraded `full`→`partial`,
  quality 8→5 — the Agent SDK/CLI don't clear the same "documented public REST/HTTP API" bar
  applied to competitors), and one **in** Claude Code's favor, applied to a competitor
  (GitHub Copilot's `agentic-mcp-server` downgraded `partial`→`none`, quality 5→0 — its cited
  evidence showed MCP *client* administration, not an official MCP server offered by the
  product). Both corrections are recorded in `data/ai-coding/verdicts.json` with rationale
  suffixes citing the review.
- **The audit's calibration samples also found the judge was *harsher* on claude-code in
  several cells**, not just lenient. The clearest example: on
  `natural-language-feature-implementation`, Claude Code's own marketing describing its core
  workflow was judged `disputed` (because cited community complaints contradicted it),
  while Codex was judged `full` on the same story from its evidence pack. A biased judge that
  favored its own vendor would not do this.
- **Two additional cells carry documented caveats** (left as computed, not adjusted,
  per the audit's own rule of "flag, don't silently override" except where adjudicated
  above):
  - `persistent-project-instructions` — `full`, quality 9. The cited community evidence
    partly complains about the feature's practical downsides (config sprawl, some output
    degradation), which the verdict's rationale doesn't fully surface. The verdict *tier*
    (`full`) is considered correct — the feature (CLAUDE.md) unambiguously exists and is used
    — but the quality score is generous given the mixed community signal.
  - `background-cloud-tasks` — both `claude-code` and `codex` scored `full`, quality 8. The
    story specifies an "isolated cloud environment"; Codex's cited evidence explicitly says
    "isolated cloud environments," while Claude Code's cited evidence confirms background/
    cloud execution but never uses the word "isolated." Both were scored `full`, but only one
    product's evidence actually supports that specific qualifier.
- **Every verdict cites evidence ids** resolvable in `data/{category}/evidence/`, so anyone
  can independently check any verdict against its source. If you disagree with a call, see
  [CONTRIBUTING.md](./CONTRIBUTING.md) — contesting a verdict is a first-class, expected
  workflow, not a one-off.

We think shipping this disclosure — including the fact that the audit itself was run by the
same vendor's model — is more honest than pretending the conflict doesn't exist. Judge for
yourself using the cited evidence.

## Local development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest — schema and scoring unit tests
pnpm build      # next build (static)
```

## Pipeline refresh workflow

The pipeline is local-only (not run on Vercel). Each stage accepts `--category <id>` to
scope a run, and most accept `--product <id>` to scope further to one product:

```bash
pnpm pipeline crawl             --category <id> [--product <id>]   # fetch site/docs/github pages
pnpm pipeline extract           --category <id> [--product <id>]   # LLM: pull candidate stories from crawled pages
pnpm pipeline normalize         --category <id>                    # LLM: assemble the category's story taxonomy
pnpm pipeline collect-community --category <id> [--product <id>]   # gather community evidence
pnpm pipeline probe             --category <id> [--product <id>]   # keyless hands-on checks (llms.txt, openapi, etc.) → probe-tier evidence
pnpm pipeline judge             --category <id> [--product <id>]   # LLM: judge every (product, story) cell
pnpm pipeline derive            --category <id>                    # compute rankings.json (scores + battles) from verdicts
pnpm pipeline logos             --category <id> [--product <id>]   # fetch product logos into public/logos/
pnpm pipeline popularity         --category <id> [--product <id>]   # keyless GitHub/npm/PyPI momentum signal (display-only, no LLM, not scored)
```

To refresh a single product's data after editing its evidence (e.g. after a contributed
correction), you don't need to re-run the whole category — see
[CONTRIBUTING.md](./CONTRIBUTING.md) for the minimal `judge --product` + `derive` flow.

After any re-judge/`derive` that changes rankings, re-run `node scripts/generate-badges.mjs`
and commit the `public/badges/` diff — the embeddable score badges (see `/badges` on the site)
are committed static SVGs, deliberately not generated during `pnpm build`, so consumers who
hotlink them pick up the new scores on the next deploy.

Requires `ANTHROPIC_API_KEY` in a local `.env` (see `.env.example`) for the LLM-driven stages
(`extract`, `normalize`, `collect-community`, `judge`).

**`ANTHROPIC_API_KEY` is local-pipeline-only. It must never be set as an environment variable
on the Vercel project** — the deployed site only serves pre-computed static data from `data/`
and never calls the Anthropic API at build or request time.

## Data layout

```
data/
  categories.json          # arena metadata: id, name, description, personas, themes
  {category}/
    products.json           # product metadata (id, name, vendor, type, urls, logo)
    stories.json             # the category's story taxonomy (incl. the 29 canonical stories, each with an optional `origin`)
    evidence/
      {product}.json          # evidence items for one product: id, tier, url, excerpt, fetchedAt
    verdicts.json            # one verdict per (productId, storyId) cell
    rankings.json            # derived: leaderboard + battles (generated by `pipeline derive`)
    popularity.json           # optional: keyless GitHub/npm/PyPI momentum signal, keyed by productId (generated by `pipeline popularity`)
    popularity-history.jsonl  # optional: one snapshot line per product per popularity run, for future velocity tracking
```

`popularity.json`/`popularity-history.jsonl` are display-only — see "Popularity — a signal, not
a score" in [METHODOLOGY.md](./METHODOLOGY.md). Neither file is read by the scoring pipeline
(`pipeline derive`) or `lib/scoring.ts`, and `loadCategory` tolerates their absence entirely.

`rankings.json` is derived data — never hand-edit it; regenerate it with
`pnpm pipeline derive --category <id>` after any verdict change.

`pnpm run build`/`pnpm run dev` mirror all of `data/` verbatim to `public/data/` (a gitignored
build artifact, via `scripts/copy-data.mjs`) so it's served at stable URLs — see "For AI
agents" below.

**Dataset releases.** Point-in-time snapshots of `data/` are periodically tagged and published
as [GitHub releases](https://github.com/ultrametricai/productarena/releases) (e.g.
`data-2026-09-02`), each with a zip of the full `data/` tree attached and release notes listing
arena/product/verdict counts at that snapshot — useful if you want a stable dataset to build
against instead of tracking `main`.

## For AI agents

ProductArena is built to be read by agents, not just browsed by humans:

- **[/llms.txt](https://ultrametric.ai/productarena/llms.txt)** — the top-level index per the
  [llms.txt convention](https://llmstxt.org): site purpose, methodology one-liner, and links to
  every arena's markdown endpoint, the data API, and `/openapi.json`.
- **Markdown endpoints** — every arena has a full-content markdown rendering at
  `/arena/{category}/llms.md` (leaderboard, business models, grouped story matrix with proof
  URLs), and every product has a deep-dive at `/arena/{category}/product/{productId}/llms.md`
  (every verdict, rationale, and proof URL). These are the pages an agent should actually read.
- **Data API** — the same JSON the site renders from is mirrored verbatim to stable URLs at
  build time (`scripts/copy-data.mjs`, a `prebuild` step): `/data/categories.json`,
  `/data/{category}/{products,stories,verdicts,rankings}.json`,
  `/data/{category}/evidence/{productId}.json`. `public/data/` is a build artifact
  (gitignored) — it doesn't exist until `pnpm run build` or `pnpm run dev` regenerates it.
- **[/openapi.json](https://ultrametric.ai/productarena/openapi.json)** — an OpenAPI 3.1 document
  describing every data endpoint above, with hand-written JSON Schema summaries of each shape
  (mirrors `lib/schemas.ts`).
- **[/methodology](https://ultrametric.ai/productarena/methodology)** — a tight, on-site summary of
  the methodology below (evidence tiers, judging, scoring, Arena Score weights, story provenance,
  re-judge stability, bias disclosure), linked from the header next to Arenas and from
  `/llms.txt`.
- **MCP** — two [MCP](https://modelcontextprotocol.io) servers expose this same data as eight
  tools (`list_arenas`, `get_rankings`, `get_product`, `get_verdict`, `search_products`,
  `compare`, `get_stacks`, `top_products`): a hosted remote endpoint at
  **[ultrametric.ai/productarena/mcp](https://ultrametric.ai/productarena/mcp)** (streamable
  HTTP, keyless, rate-limited — served by `infra/cloudflare-proxy/worker.js`; opening the URL
  in a browser shows the setup page) and the **`productarena-mcp`** npm package (stdio, `mcp/`
  in this repo — `claude mcp add productarena -- npx -y productarena-mcp`). See
  [`mcp/README.md`](./mcp/README.md) for full setup and client config.
- **schema.org** — arena pages embed an `ItemList` of `SoftwareApplication` entries and product
  pages embed a `SoftwareApplication`, both with `additionalProperty` entries for our own
  metrics (`aiEra`, `score`, etc). No `aggregateRating` — we don't have star ratings, and faking
  one would be dishonest.
- **sitemap.xml / robots.txt** — `app/sitemap.ts` lists every route including the `llms.md`
  endpoints; `public/robots.txt` explicitly allows `GPTBot`, `ClaudeBot`, `Claude-Web`,
  `PerplexityBot`, `Googlebot`, and `Bingbot`, with a `Sitemap:` pointer.

## Status & roadmap

ProductArena is live at **[ultrametric.ai/productarena](https://ultrametric.ai/productarena)** and under active expansion. In flight:

- **Finer-grained arenas** — splitting broad categories (e.g. project management, edge
  platforms) into narrower slices as products diverge enough to need it.
- **New arenas incoming**: the full build queue lives in
  [`data/arena-roadmap.json`](./data/arena-roadmap.json) (170+ planned arenas in priority
  tiers — see [`docs/COVERAGE-STRATEGY.md`](./docs/COVERAGE-STRATEGY.md)); founder-ops
  next steps are specced in [`docs/FOUNDER-OPS-ROADMAP.md`](./docs/FOUNDER-OPS-ROADMAP.md)
  and classic head-to-heads in [`docs/CLASSIC-BATTLES.md`](./docs/CLASSIC-BATTLES.md).
- **Recorded proofs** — CLI/MCP probe sessions are now captured as sanitized, replayable
  transcripts (and pilot browser video) published on product pages; the
  [`docs/PROVE-IT.md`](./docs/PROVE-IT.md) protocol lets vendors submit reproducible proof
  specs our runner executes and publishes — pass or fail.
- **The Agentic Depth Program** — a deeper, runtime-conformance-tested successor to the
  current agenticness/API-quality cells (MCP handshake checks, API probe suites, CLI
  conformance, agent task trials, and a monthly agentic-velocity leaderboard). See
  [`docs/AGENTIC-DEPTH-PROGRAM.md`](./docs/AGENTIC-DEPTH-PROGRAM.md) for the full plan.
- **The contest flow** — every verdict is contestable today (see
  [Contributing](#contributing) below); `.github/workflows/contest-check.yml` can automate
  the add-evidence → re-judge → PR loop once a maintainer wires up the `ANTHROPIC_API_KEY`
  secret.
- **Continuous runners** — `.github/workflows/story-runner.yml` re-runs one arena's full
  pipeline every 6 hours on rotation and opens a reviewable PR (idle until the
  `ANTHROPIC_API_KEY` secret is set); an arena-builder runner that works through the
  roadmap automatically is designed in `docs/COVERAGE-STRATEGY.md`.

Counts on this page (arenas/products/verdicts) are generated by `pnpm stats` — see
`scripts/update-readme-stats.mjs` — and will keep moving as arenas and products are added;
treat them as a snapshot, not a promise.

## Contributing — how the community can help

Every score on the site is only as good as its evidence, so evidence work is the
contribution. Pick your angle:

- **Contest a verdict** — every verdict has a "⚑ contest" link that opens a prefilled
  issue. Bring a citation that contradicts (or supports) the ruling.
- **Prove a story** — submit a reproducible proof spec (setup + commands + expected
  result) via the *Prove a story* issue form; our runner executes and records it, and the
  recording is published as probe-tier evidence — pass or fail. See
  [`docs/PROVE-IT.md`](./docs/PROVE-IT.md).
- **Respond as a vendor** — put an official, verified statement on the record next to a
  verdict about your product (CVE-style) via the *Vendor response* issue form. Published
  verbatim; it never changes a verdict by itself, but feeds the next re-judge. See
  [`docs/VENDOR-RESPONSES.md`](./docs/VENDOR-RESPONSES.md).
- **Add evidence by PR** — new doc pages, changelogs, or community sources for any
  product; the pipeline re-judges only the cells whose evidence changed.
- **Submit a product or arena** — the *Submit a product* issue form, or open a PR seeding
  `data/categories.json` + products following an existing arena's shape.
- **Report an inaccuracy** — wrong metadata, broken link, stale evidence, missing logo.
- **Adopt an arena** — become the standing reviewer for one arena's story taxonomy,
  evidence freshness, and contest triage.
- **Run probes locally** — `pnpm pipeline probe --category <id>` needs no API key;
  publishing discrepancies you find is exactly the point.
- **Cite the data** — verdicts, scores, and evidence excerpts may be quoted with
  attribution (see DATA-LICENSE); bulk reuse needs written permission from Ultrametric.

Found a verdict you think is wrong, or evidence we missed? See
[CONTRIBUTING.md](./CONTRIBUTING.md) — contesting a verdict and adding evidence are both
first-class, expected contribution paths. Every verdict on the site has a "⚑ contest" link
that opens a prefilled GitHub issue with the category/product/story and current verdict
already filled in; a maintainer (or, in the future, a GitHub Action) does the deeper check —
adding evidence, then `pnpm pipeline judge --category <category> --product <product>` followed
by `pnpm pipeline derive --category <category>` — before any verdict actually changes.

## License

Code: © 2026 Ultrametric Inc, all rights reserved (source-available — see LICENSE).
Data (`data/`): © 2026 Ultrametric Inc, all rights reserved (see DATA-LICENSE) — viewable
and quotable with attribution; bulk reuse requires written permission.

