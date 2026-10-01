# Business logic — decision support, calculations, calendars, comparisons

Part of [the open startup repo](../README.md#business-logic): reusable business logic —
decision support, calculations, calendars, and comparisons — separate from law (`rules/`) and
the vendor evidence layer (`vendors/`, `data/`). The modules live in `lib/openstartup/`
(cap table, runway & burn, deadline calendar, equity-comp scenarios, convertible notes,
liquidity-event waterfalls, 409A grant sanity), every one pure,
client-safe, and validated by worked-example and property tests
(`npx vitest run lib/openstartup/__tests__/`). Repo-first by design: use the modules from
tests, scripts, or your own agent. Every module must ship a contract, version, explicit assumptions,
worked examples reproduced from cited public sources, deterministic tests, and explicit
jurisdiction dependencies. Business logic may propose a result; it must never silently
authorize a tax election, equity grant, bank transfer, contract, or vendor disclosure. A module
that leans on a legal threshold must reference a dated rule card in `rules/` and return
`needs_review` when the applicable locale or date is unknown.

## Modules

- **Cap table** — `lib/openstartup/capTable.ts` (+ `capTableCodec.ts`) — repo-only
  library by founder call (2026-09-28), no site page. Pure functions for founder issuance and vesting (4-year/1-year-cliff
  convention per Cooley GO), option pools (including the in-round pool shuffle), post-money
  SAFE conversion per the YC Post-Money Safe User Guide (cap/discount/MFN/pro rata; guide
  Appendix II examples reproduced number-for-number in the tests), priced-round PPS solving,
  and dilution waterfall reports. Status: worked-example-verified against the cited guides,
  property-tested (ownership sums to 100%, no negative shares) — **not** independently
  expert-certified, and the module docs say so.

- **Runway & burn** — `lib/openstartup/runway.ts` — pure, client-safe. Contract:
  `simpleRunwayMonths` (the naive cash/burn baseline), `defaultAliveReport` (Paul Graham's
  default-alive test, cited to https://paulgraham.com/aord.html: constant expenses by default,
  compounding revenue, month-by-month trajectory with profitability/zero-cash months and the
  cash trough), `growthAdjustedRunwayMonths`, and `hiringImpact` (replays the projection with
  a hiring plan layered on; measures the alive→dead flip the essay warns about). Assumptions
  explicit in the module header: month 0 is now, net burn = expenses − revenue, hire costs
  flat from their start month. Status: worked-example-verified with hand-derived arithmetic in
  `lib/openstartup/__tests__/runway.test.ts`, property-tested (cash identity, status/event
  consistency, determinism). Educational model, not financial advice.
- **Deadline calendar** — `lib/openstartup/deadlines.ts` — pure, client-safe; UTC ISO-date
  arithmetic only. Contract: `deFranchiseTaxDue` (March 1 — rule
  `us-de.franchise-tax-annual-report`), `form1120Due` (15th day of the 4th month, June-30
  exception — rule `us-fed.1120-filing-deadline`), `form941Due` (last day of the month after
  the quarter — rule `us-fed.941-quarterly-deadline`), `election83bWindow` (day 30 — rule
  `us-fed.83b-filing-period`, ALWAYS `needsReview`), and `complianceCalendar` (the recurring
  clock between two dates). Every deadline references a dated rule card by id — no hardcoded
  day count without a primary-sourced card — and the gate
  (`lib/openstartup/__tests__/deadlines.test.ts`) fails if a referenced card is missing or
  jurisdiction-mismatched. `needsReview: true` marks dates that can move (weekend landings,
  statutory exceptions, event-date questions); legal holidays are declared out of scope, and
  the module never extends or legally determines a deadline.
- **Offer / equity-comp scenarios** — `lib/openstartup/equityComp.ts` — pure, client-safe.
  Contract: `grantOwnershipPct` (% of fully diluted — the Rewarding Talent sizing
  convention), `commonSharePriceAtExit` (exit ÷ fully diluted, a common-stock proxy that
  ignores liquidation preferences and says so), `optionSpread`, `grantExitOutcome` /
  `offerScenarioTable` (strike, future-dilution, and exit-value scenarios; every outcome
  carries `needsReview: true`), and `vestedExitOutcome` (reuses the cap-table module's
  Cooley GO vesting). Cited to the Holloway Guide to Equity Compensation and Index Ventures'
  Rewarding Talent (resource ids `holloway-equity-guide`, `index-rewarding-talent`); the
  strike-price floor references rule `us-fed.409a-stock-right-exception`, and the module takes
  the 409A FMV as input — it never invents one. Everything is pre-tax by design (ISO/NSO,
  AMT, QSBS, and 83(b) interactions are out of scope and flagged as such). Worked examples in
  `lib/openstartup/__tests__/equityComp.test.ts`.
- **Convertible notes** — `lib/openstartup/convertibleNote.ts` — pure, client-safe. Contract:
  `accruedSimpleInterest` / `noteBalance` (simple interest only, actual-day count over an
  explicit basis; compounding, 30/360, and default interest are the note's own text, flagged),
  `noteConversionPrice` / `convertNote` (cap and discount "in the alternative" at the lowest
  price — Cooley GO's convertible-debt primer; the cap denominator must be supplied from the
  note's own capitalization definition, which Cooley GO's "Understanding the Valuation Cap"
  shows is contract-specific — never invented here), `capImpliedDiscountPct` (replays that
  article's $3M-cap-on-$10M = 70% figure), `maturityStatus` (the three published maturity
  paths — repay, extend, convert — surfaced, never decided), `seriesPricingWithNotes` (the
  pre-money / percentage-ownership / dollars-invested methods of Cooley GO's "Calculating
  Share Price With Outstanding Convertible Notes or Safes", its worked example replayed
  number-for-number), and `NOTE_VS_SAFE` (the structural note-vs-SAFE differences, each line
  cited to the YC User Guide and the primer). Tests:
  `lib/openstartup/__tests__/convertibleNote.test.ts`.
- **Liquidity-event waterfall** — `lib/openstartup/waterfall.ts` — pure, client-safe.
  Contract: `liquidityWaterfall` (per-holder proceeds at a sale price: the SAFE
  cash-out-vs-convert choice per YC Post-Money Safe User Guide §A.3/§C.1, with Appendix II
  Example 1 Q3/Q4 replayed number-for-number; one preferred series at 1x or a stated
  multiple, non-participating vs participating per the Cooley GO "Preferred Stock" glossary
  definitions; a pari passu preference tier per §A.5-A.6; exact-cents largest-remainder
  allocation so proceeds sum to the price), plus `safeLiquidityShares`,
  `conversionIndifferencePrice`, and `allocateCents`. Property-tested: proceeds sum to the
  price exactly, no payout is negative, non-participating holders take the greater of
  preference and as-converted value. Deliberately out of scope (no citable worked example at
  this bar): capped participation, stacked seniority, accruing dividends, debt, escrows —
  the price must be net of debt, and every report carries `needsReview: true`.
- **409A grant sanity** — `lib/openstartup/grant409aSanity.ts` — a sanity model, NOT a
  valuation: it takes the 409A FMV as input and never invents one (the equityComp posture;
  `producesValuation: false` by construction — a credible valuation needs appraisal judgment
  a pure function cannot honestly package, so this is the deliberately smaller honest
  version). Contract: `strikeFloorCheck` (rule `us-fed.409a-stock-right-exception`),
  `fmvAgeCheck` (rule `us-fed.staleness`: the 12-month window, plus term-sheet and
  material-change flags — the term-sheet convention cited to YC User Guide §B.6),
  `appraisalPresumptionCheck` (rule `us-fed.independent-appraisal-presumption`, timing only —
  qualification is counsel's question), `preferredCommonRatioIllustration` (a labeled
  illustration leaning on rule `us-fed.reasonable-method`'s caveat that a preferred financing
  price is not common FMV), and `grantSanityReport`. Every check cites a committed rule card
  by id — the gate (`lib/openstartup/__tests__/grant409aSanity.test.ts`) fails if a card is
  missing or jurisdiction-mismatched — and every finding is `needsReview: true`.

Still planned: hiring cost comparisons beyond the runway impact (benefits/payroll-tax load
factors need dated rule cards first). The conservative workflow planner lives in
`lib/founderOps.ts` and is gated by `__tests__/founder-ops.test.ts`.

## What you can contribute here

- **A new business-logic module** — pure TypeScript under `lib/openstartup/` plus an index
  entry in this README. The bar is fixed: pure functions, a citation on every formula's doc
  comment (a published guide, form, or primary source — never "everyone knows"), explicit
  rounding, worked examples reproduced number-for-number from the cited source, and property
  tests. Candidates: hiring cost comparisons (benefits/payroll-tax load factors, backed by
  dated rule cards in `rules/`, never hardcoded day counts), non-US instruments, and
  waterfall extensions (capped participation, stacked seniority — each needs a citable
  worked example before it ships). Gate:
  `npx vitest run lib/openstartup/__tests__/` (and `pnpm test`).
- **Harden an existing module** — a missed edge case from a cited worked example, a new
  property test, or a correction with the source that proves it (e.g. the YC Post-Money Safe
  User Guide for `capTable.ts`).
- **Honesty rules** — a module that leans on a legal threshold must reference a dated rule
  card in `rules/` and return `needs_review` when locale or date is unknown; results are
  decision support, never authorization.
