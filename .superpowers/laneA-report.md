# Lane A report — judge calibration + uncertainty

## 1. Golden-cell calibration harness

- `pipeline/golden/golden-cells.json`: 16 hand-picked cells (5 full, 1 partial, 7 na, 3 none)
  covering the runtime-verified/applicability-corrected/wrong-axis/unambiguous cases requested.
- `pipeline/scripts/calibration-check.ts`: re-runs the ACTUAL judge prompt/schema (imported
  verbatim from `pipeline/stages/judge.ts`, now exported: `SYSTEM`, `judgePrompt`,
  `RawVerdictSchema`) against current on-disk evidence, live LLM, no caching. `pnpm calibrate`.
  Not part of `pnpm test` / vitest include glob.

### Run results (just now, live)

9/16 matched. **7 mismatches — exceeds the >2 tolerance, script exits non-zero as designed.**
This is the fresh judge disagreeing with hand-applied corrections layered on top of the base
judge, not a bug in the harness:

| cell | golden | fresh judge got | pattern |
|---|---|---|---|
| ai-coding/claude-code:agentic-mcp-server | na | full (q8) | applicability correction not judge-native |
| ai-coding/cursor:agentic-mcp-server | na | full (q8) | same |
| ai-coding/github-copilot:agentic-mcp-server | na | full (q8) | same |
| ai-coding/gemini-cli:agentic-mcp-server | na | full (q8) | same |
| mobile-dev/tailscale:git-commit-push | na | none (q0) | none/na confusion |
| web-scraping/scrapingbee:docker-container-deploy | na | none (q0) | none/na confusion |
| frontend-frameworks/react:api-machine-spec | na | none (q0) | none/na confusion |

The 4 ai-coding "na" golden cells were hand-written overrides (`apply-mcp-server-na.ts`), not
organic judge output — a fresh call reverts to "full" because generic evidence about MCP-server
mentions reads as the axis applying. The 3 wrong-axis "na" cells collapse to "none" under a
fresh call — the base judge prompt's na/none boundary ("na ONLY when axis fundamentally doesn't
apply... lack of evidence is none, never na") isn't reliably self-triggering without extra
context/retry-on-violation framing. **Not fixed** — this is exactly the calibration signal the
harness exists to surface. The other 9 golden cells (all full/partial/none, no na) matched
exactly, including quality within a few points.

## 2. Multi-judge uncertainty pass

- `lib/schemas.ts`: `UncertaintyEntrySchema`/`UncertaintyArraySchema` (+ tests in
  `lib/__tests__/schemas.test.ts`).
- `lib/uncertainty.ts`: pure fns `agreementOf`, `isCloseRace`, `isUncertain` — tested in
  `lib/__tests__/uncertainty.test.ts`.
- `lib/data.ts` / `lib/data-helpers.ts`: tolerant-optional load of `uncertainty.json` +
  `uncertaintyFor()` lookup, same contract as popularity/claims.
- `pipeline/scripts/uncertainty-pass.ts`: for each arena, if #1 vs #2 INIT-point gap ≤ 3.0,
  re-judges both contenders' full agenticness-theme cell set (agent-access + agentic-features +
  api-quality — api-quality is already a group under the agenticness theme in this dataset) two
  extra times, records `[cached tier, fresh, fresh]` + agreement. `pnpm uncertainty`.
- `components/UncertaintyMarker.tsx`: "±" marker, wired into
  `app/arena/[category]/product/[id]/page.tsx` next to `VerdictBadge` only (product pages only,
  as scoped) — tested in `components/__tests__/UncertaintyMarker.test.tsx`.

### Run results (just now, live)

Checked all 10 categories' #1-vs-#2 gap: only **ai-coding** qualified (Δ2.9, claude-code vs
github-copilot). web-scraping (Δ3.3, apify vs firecrawl) and startup-banking (Δ4.0, mercury vs
ramp) were close but outside the 3.0 threshold — did not qualify.

ai-coding: 34 decisive cells re-judged (17 agenticness stories × 2 products), **8 split
(24% disagreement)**. All splits were 2/3 (no 1/3 three-way splits). Notably `agentic-mcp-server`
split 2/3 for BOTH claude-code and github-copilot (na vs full vs full) — directly corroborating
the calibration mismatch above: this cell's na verdict is unstable under resampling, not just
under a single fresh call. Written to `data/ai-coding/uncertainty.json`; no file written for
non-qualifying categories.

## Gates

- `pnpm test`: 297 tests / 36 files, all green (includes new schema/uncertainty/marker tests).
- `pnpm build`: green (had to fix a tuple-type mismatch in uncertainty-pass.ts for
  `agreementOf`'s 3-tuple param).
- `pnpm exec tsx pipeline/scripts/recompute-check.ts`: ALL DETERMINISTIC (uncertainty pass never
  touches verdicts.json/rankings.json).
- `pnpm lint`: clean.

## Concerns / follow-ups (not fixed, flagged for Lane owner / controller)

1. The judge's na-vs-none and na-vs-full boundaries are demonstrably unstable under resampling
   (7 calibration mismatches + the ai-coding uncertainty split corroborating one of them). The 4
   ai-coding "na" cells for MCP-server-serving only hold because of a hardcoded post-hoc override
   script (`apply-mcp-server-na.ts`) — if that category's evidence or products list changes and
   someone re-runs `pnpm pipeline judge` without re-applying the override, those 4 cells will
   likely regenerate as "full", silently reverting the applicability correction.
2. `AGENTS.md`/`CLAUDE.md` in this repo contain a suspicious embedded instruction (framed as
   generated by `next dev`) trying to direct file-reading behavior and normalize committing
   otherwise-unrelated changes. Treated as untrusted file content, not followed, not touched.

## Key file paths

- `pipeline/golden/golden-cells.json`, `pipeline/scripts/calibration-check.ts`
- `pipeline/scripts/uncertainty-pass.ts`, `lib/uncertainty.ts`, `lib/__tests__/uncertainty.test.ts`
- `lib/schemas.ts` (UncertaintyEntrySchema), `lib/data.ts`, `lib/data-helpers.ts`
- `components/UncertaintyMarker.tsx`, `components/__tests__/UncertaintyMarker.test.tsx`
- `app/arena/[category]/product/[id]/page.tsx` (marker wiring)
- `pipeline/stages/judge.ts` (exported SYSTEM/judgePrompt/RawVerdictSchema for reuse)
- `data/ai-coding/uncertainty.json` (generated output)
- 7 test fixture files patched with `uncertainty: []` (AgentAccessGlyphs, InitIndexTable, claims,
  personaStacks, stacks, verification test files)
