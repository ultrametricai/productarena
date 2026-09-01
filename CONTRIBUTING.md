# Contributing to AIness

AIness's whole premise is that every score should trace back to cited evidence, and
that anyone can contest a verdict. This document covers the two contribution paths (contest
a verdict, or add evidence) plus local setup and style rules.

## 1. Contest a verdict

Every verdict shown on the site (battle round cards, product pages) carries a small
"⚑ contest" link right next to it. Clicking it opens a prefilled GitHub issue — category,
product, story id, and the current verdict/quality are filled in for you, with empty sections
for your proposed verdict, evidence URLs, and quotes. It's the fast path for flagging
something that looks wrong; it does not itself change any data. A maintainer (or, eventually,
a GitHub Action) still has to do the deeper check described below: add the evidence, run
`pnpm pipeline judge --category <category> --product <product>`, then
`pnpm pipeline derive --category <category>` to actually update the verdict.

If you'd rather skip the prefilled link, you can also open an issue manually using the
[Contest a Verdict](./.github/ISSUE_TEMPLATE/contest-verdict.md) template. Fill in:

- `category` and `product` (must match the ids in `data/categories.json` / `data/{category}/products.json`)
- `story id` (from `data/{category}/stories.json`)
- the current verdict (tier + quality, from `data/{category}/verdicts.json`)
- your proposed verdict
- evidence URLs and quotes supporting your proposal

**Flow:**

1. You open the issue with the fields above.
2. A maintainer reviews it against the cited evidence in `data/{category}/evidence/{product}.json`.
3. If your evidence is new or better, the maintainer (or you, via a PR — see below) adds it
   to the product's evidence file and re-judges:
   ```bash
   pnpm pipeline judge --category <category> --product <product>
   pnpm pipeline derive --category <category>
   ```
   Note this re-judges **every** cell for that product, not just the one you're contesting —
   see the cache note below.
4. The updated `verdicts.json` and `rankings.json` are committed with a reference to the
   issue.

### Automated contest resolution (GitHub Action)

`.github/workflows/contest-check.yml` can do steps 2–4 above automatically: when an issue is
labeled `contest` (or a maintainer runs the workflow manually via `workflow_dispatch` with an
`issue_number`), it runs `pnpm tsx pipeline/contest-check.ts --issue <n>`, which:

1. Fetches the issue and parses the category/product/story id and the "Evidence URLs" section
   from its body (tolerant of the exact template — see `pipeline/__tests__/contest-check.test.ts`
   for the cases it handles).
2. Fetches each evidence URL and appends it as a `claimed-docs`-tier evidence item, ided
   `{product}-contest-{issueNumber}-{n}` (namespaced by issue so it can never collide with ids
   the pipeline itself mints, or with another contest issue's items).
3. Re-runs `judge --category <category> --product <product>` and `derive --category <category>`.
4. Opens a PR on a `contest-{issueNumber}` branch referencing the issue, and comments the
   outcome (PR link, or a failure reason) back on the issue.

**This ships dormant.** It requires an `ANTHROPIC_API_KEY` repository secret (Settings →
Secrets and variables → Actions) — without it, the workflow fails fast at a "Verify required
secret" step with a clear error, before touching any data. Only a maintainer can add that
secret. Until it's configured, contested verdicts still go through the manual flow above.

You don't need to be a maintainer to do step 3 yourself — see the PR flow below.

## 2. Add evidence (PR flow)

If you have a source (docs, changelog, GitHub, a hands-on write-up) that should change a
verdict, you can propose it directly as a PR:

1. Fork/branch, then edit `data/{category}/evidence/{product}.json` to add your evidence
   item. Each item needs:
   - `id` — a unique, stable id (convention: `{product}-{tier-prefix}-{n}`, e.g. `claude-code-docs-20`)
   - `tier` — one of `claimed-docs`, `github`, `community`, `probe`
   - `url` — the source URL
   - `excerpt` — a verbatim quote (not a paraphrase) supporting the claim
   - `fetchedAt` — an ISO 8601 datetime
2. Re-judge that product:
   ```bash
   pnpm pipeline judge --category <category> --product <product>
   pnpm pipeline derive --category <category>
   ```
3. Commit **both** the evidence file and the resulting `verdicts.json` / `rankings.json`
   changes in the same PR — never hand-edit `verdicts.json` or `rankings.json` directly.
4. Open the PR describing what the new evidence shows and which cell(s) you expect to change.
   A maintainer will sanity-check the diff (does the new verdict actually follow from the
   cited excerpt?) before merging.

### About the judge cache and re-judge cost

The judge cache (`pipeline/cache/judge/`) **is committed** to the repo, keyed by a hash of
`(storyId, story title, the product's full evidence array, prompt version)` — note that's the
*whole* evidence pack, not just the item(s) you cite. This has two consequences:

- **If you haven't touched a product's evidence, re-running `judge` for it is free** (all
  cells are cache hits — no LLM calls, no `ANTHROPIC_API_KEY` even needed to hit the fast
  path). This is why the judge cache is tracked in git: everyone shares the same cache and
  doesn't re-pay for verdicts nobody changed.
- **If you add/edit/remove even one evidence item for a product, every cell hash for that
  product changes** — because the hash covers the full pack, not just the changed item. A
  `judge --product <product>` run will therefore re-send **all** of that product's stories to
  the LLM, not just the one your new evidence supports. Approximate cost: one LLM call per
  story in the category (currently ~42–57 depending on category — see
  `data/{category}/stories.json` length), each a small JSON-mode call. This is expected
  and intentional (it keeps the judge honest about re-evaluating the whole pack), just budget
  for it — a single-evidence-item PR is not a single-LLM-call PR.

## Local setup

```bash
git clone <repo>
cd AIness
pnpm install
cp .env.example .env    # fill in ANTHROPIC_API_KEY if you need to run extract/normalize/collect-community/judge
pnpm dev                # http://localhost:3000
```

`ANTHROPIC_API_KEY` is only needed for the LLM-driven pipeline stages (`extract`,
`normalize`, `collect-community`, `judge`) run locally. It is **never** required to run the site itself, and it
must **never** be set on the Vercel project — the deployed site serves pre-computed static
`data/` and makes no LLM calls at build or request time.

## Style: schemas are law

Every data file (`categories.json`, `products.json`, `stories.json`, `evidence/*.json`,
`verdicts.json`, `rankings.json`) is validated against a Zod schema in `lib/schemas.ts`.
Before opening a PR that touches any `data/` file, run:

```bash
pnpm test
```

This runs the schema and scoring unit tests (`vitest`) and will fail loudly if your change
produces invalid data — e.g. a verdict missing a required `evidenceId`, a `na` verdict with
nonzero quality, or a `disputed` verdict citing only one evidence tier. A PR that doesn't
pass `pnpm test` won't be merged.

## No secrets

Never commit `.env`, API keys, or tokens. `.gitignore` already excludes `.env*` (except
`.env.example`) — if you're ever unsure whether something contains a secret, don't commit it
and ask first. If you accidentally commit one, tell a maintainer immediately so the key can
be rotated — don't rely on a follow-up commit to "remove" it, since it stays in git history.
