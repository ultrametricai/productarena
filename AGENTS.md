<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# House rules

These bind every agent and contributor working in this repo.

## Evidence doctrine

- Never hand-tune a verdict, score, rank, or leaderboard position. Every ranked number is
  computed from judged evidence by the pipeline — change the inputs or the code, never the
  output. Honest negatives stay published.
- Every claim cites its evidence (vendor docs, GitHub, community sources, or a recorded
  probe). No citable evidence → no claim. Never fabricate a URL; if a source is bot-walled,
  document that and substitute a reachable one.
- Products affiliated with the founders are disclosed and bias-audited, never favored.
- Counts shown on pages are computed at build time, never hand-written. README and doc
  prose carries no counts and no dates that will go stale.

## Writing voice

- Functional titles: say what the page or table shows. No marketing adjectives, no
  "judged on evidence"-style suffixes, no invented framing ("the three pillars"), no
  conversational tics ("all pure", "the real X").

## Gates — exit codes, never grep'd output

All of these must exit 0 before any merge to main:

1. `pnpm recompute-check` (derived data deterministic)
2. `pnpm tsc --noEmit`
3. `pnpm lint` (0 errors)
4. `pnpm vitest run --maxWorkers=2`
5. `pnpm shared:check` when `content/processes/` or the shared corpus is touched

Never gate an `&&` chain on echoed text — test the tool's exit code.

## Workflow

- Every change lands as a branch + pull request. No direct commits to main.
- One `next build` at a time machine-wide; worktree lanes never build.
- Authored records in `content/processes/` are never overwritten by catalog regeneration:
  refresh only source-mirrored metadata and re-bless the manifest
  (see `scripts/shared-processes/import.py`, authored-record conflict rule).

## Immutable identifiers — legacy on purpose, never rename

`PROVENANCE_KEY 'productarena-provenance-v1'`; `pa-*` localStorage keys; `pa_session` /
`pa_state` cookies; recorded probe-evidence strings (`'productarena certify'`,
`PA_PROBE_OK`, `'productarena-probe'` user agents); `lib/mcpDemoCalls` `'self/productarena'`;
manifest source `'productarena'`; the `#pa-score` anchor; the `productarena-proxy` worker
name; `/productarena` redirect routes. These are recorded evidence or deployed state —
renaming them breaks provenance. New code reads `UM_*` env names first with `PA_*` as
deprecated fallback; user-facing copy never says "productarena" or "PA".

# Shared process content

The shared situations/process schema and records live in `content/processes/`.
Keep the old corpus, chains, jurisdiction files, and site loaders working during
the additive transition. Public Git owns shared process meaning. Private UM
instructions live as versioned additions in the API database. Do not use the
retired private process repo as a source of authority or copy private guides here.
Run `pnpm shared:check` and the shared-process tests for schema or catalog changes.
