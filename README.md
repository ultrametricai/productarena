# Product Arena

Product Arena is an evidence-based comparison site. For each of 7 product arenas we crawl
vendor docs, GitHub, and community sources, extract per-product evidence, and have an LLM
judge every product against a shared set of user stories. The result is a leaderboard, a
head-to-head battle log, and a per-product story matrix — every score traces back to cited
evidence, not opinion.

Live site: https://productarena.vercel.app

As of the last full pipeline run: **7 arenas, 36 products, 1,844 judged verdicts.**

## The arenas

| Arena | Products |
|---|---|
| AI Coding Agents (`ai-coding`) | claude-code, codex, cursor, github-copilot, gemini-cli |
| Code Hosting (`code-hosting`) | github, gitlab, bitbucket, gitea |
| Desktop OS (`desktop-os`) | macos, omarchy, ubuntu, fedora |
| Mobile AI Dev Tools (`mobile-dev`) | termius, tailscale, blink-shell, a-shell, working-copy, github-mobile |
| Project Management (`project-management`) | linear, asana, clickup, notion, monday, jira |
| Startup Banking (`startup-banking`) | mercury, brex, ramp, wise, relay |
| Web Scraping APIs (`web-scraping`) | firecrawl, crawl4ai, jina-reader, apify, scrapingbee, browserbase |

See `data/categories.json` for each arena's full description, personas, and themes.

## Methodology

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

### 4. The Agenticness Index

Every arena includes the same 8 canonical "agenticness" stories, injected verbatim (never
LLM-authored) so agent-readiness is comparable across categories. Defined in
`pipeline/agentic-stories.ts`:

| Story id | Story | Weight |
|---|---|---|
| `agentic-public-api` | I can drive the product through a documented public API | 3 |
| `agentic-official-cli` | I can use an official CLI | 2 |
| `agentic-mcp-server` | I can connect an agent via an official MCP server | 3 |
| `agentic-webhooks` | I can subscribe to events via webhooks | 2 |
| `agentic-sdks` | I can build against official SDKs | 2 |
| `agentic-agent-docs` | I can point an agent at llms.txt or agent-oriented docs | 2 |
| `agentic-scoped-keys` | I can issue scoped/least-privilege API credentials for an agent | 2 |
| `agentic-headless` | I can run the product headlessly / in CI for automation | 2 |

A product's "agenticness" score on the leaderboard is its weighted percentage across just
these 8 cells (theme `agenticness`, group `agent-access`).

### 5. Judge model and prompt version

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

### 6. Bias disclosure — the judge is an Anthropic model

**Read this before trusting the `ai-coding` arena's numbers.** The judge model
(`claude-sonnet-5`) is made by Anthropic, and the `ai-coding` arena includes Anthropic's own
product, Claude Code, which currently leads that arena (score 35.2). This is a real
conflict of interest and we want it visible, not buried.

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
```

To refresh a single product's data after editing its evidence (e.g. after a contributed
correction), you don't need to re-run the whole category — see
[CONTRIBUTING.md](./CONTRIBUTING.md) for the minimal `judge --product` + `derive` flow.

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
    stories.json             # the category's story taxonomy (incl. the 8 canonical agentic stories)
    evidence/
      {product}.json          # evidence items for one product: id, tier, url, excerpt, fetchedAt
    verdicts.json            # one verdict per (productId, storyId) cell
    rankings.json            # derived: leaderboard + battles (generated by `pipeline derive`)
```

`rankings.json` is derived data — never hand-edit it; regenerate it with
`pnpm pipeline derive --category <id>` after any verdict change.

## Contributing

Found a verdict you think is wrong, or evidence we missed? See
[CONTRIBUTING.md](./CONTRIBUTING.md) — contesting a verdict and adding evidence are both
first-class, expected contribution paths. Every verdict on the site has a "⚑ contest" link
that opens a prefilled GitHub issue with the category/product/story and current verdict
already filled in; a maintainer (or, in the future, a GitHub Action) does the deeper check —
adding evidence, then `pnpm pipeline judge --category <category> --product <product>` followed
by `pnpm pipeline derive --category <category>` — before any verdict actually changes.

## License

[MIT](./LICENSE)
