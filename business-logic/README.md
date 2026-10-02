# Business logic — decision support, calculations, calendars, comparisons

Part of [the open startup repo](../README.md#business-logic): reusable business logic —
decision support, calculations, calendars, and comparisons — separate from law (`rules/`) and
the vendor evidence layer (`vendors/`, `data/`). The modules live in `lib/openstartup/`
(cap table, runway & burn, deadline calendar, equity-comp scenarios, convertible notes,
liquidity-event waterfalls, 409A grant sanity, vesting mechanics, anti-dilution,
priced-round mechanics, ISO/NSO exercise tax, 83(b) math, QSBS, Delaware franchise tax,
R&D tax mechanics, employer payroll tax), every one pure,
client-safe, and validated by worked-example and property tests
(`npx vitest run lib/openstartup/__tests__/`). Repo-first by design: use the modules from
tests, scripts, or your own agent. Every module must ship a contract, version, explicit assumptions,
worked examples reproduced from cited public sources, deterministic tests, and explicit
jurisdiction dependencies. Business logic may propose a result; it must never silently
authorize a tax election, equity grant, bank transfer, contract, or vendor disclosure. A module
that leans on a legal threshold must reference a dated rule card in `rules/` and return
`needs_review` when the applicable locale or date is unknown.

## Modules

### Cap table

`lib/openstartup/capTable.ts` (+ `capTableCodec.ts`) — repo-only
library by design, no site page. Pure functions for founder issuance and vesting (4-year/1-year-cliff
convention per Cooley GO), option pools (including the in-round pool shuffle), post-money
SAFE conversion per the YC Post-Money Safe User Guide (cap/discount/MFN/pro rata; guide
Appendix II examples reproduced number-for-number in the tests), priced-round PPS solving,
and dilution waterfall reports. Status: worked-example-verified against the cited guides,
property-tested (ownership sums to 100%, no negative shares) — **not** independently
expert-certified, and the module docs say so.

### Runway & burn

`lib/openstartup/runway.ts` — pure, client-safe. Contract:
`simpleRunwayMonths` (the naive cash/burn baseline), `defaultAliveReport` (Paul Graham's
default-alive test, cited to https://paulgraham.com/aord.html: constant expenses by default,
compounding revenue, month-by-month trajectory with profitability/zero-cash months and the
cash trough), `growthAdjustedRunwayMonths`, and `hiringImpact` (replays the projection with
a hiring plan layered on; measures the alive→dead flip the essay warns about). Assumptions
explicit in the module header: month 0 is now, net burn = expenses − revenue, hire costs
flat from their start month. Status: worked-example-verified with hand-derived arithmetic in
`lib/openstartup/__tests__/runway.test.ts`, property-tested (cash identity, status/event
consistency, determinism). Educational model, not financial advice.

### Deadline calendar

`lib/openstartup/deadlines.ts` — pure, client-safe; UTC ISO-date
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

### Offer / equity-comp scenarios

`lib/openstartup/equityComp.ts` — pure, client-safe.
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

### Convertible notes

`lib/openstartup/convertibleNote.ts` — pure, client-safe. Contract:
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

### Liquidity-event waterfall

`lib/openstartup/waterfall.ts` — pure, client-safe.
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

### 409A grant sanity

`lib/openstartup/grant409aSanity.ts` — a sanity model, NOT a
valuation: it takes the 409A FMV as input and never invents one (the equityComp posture;
`producesValuation: false` by construction — a credible valuation needs appraisal judgment
a pure function cannot honestly package, so this is the deliberately smaller honest
version). Contract: `strikeFloorCheck` (rule `us-fed.409a-stock-right-exception`),
`fmvAgeCheck` (rule `us-fed.staleness`: the 12-month window, plus term-sheet and
material-change flags — the term-sheet convention cited to YC User Guide §B.6),
`appraisalPresumptionCheck` (rule `us-fed.independent-appraisal-presumption`, timing only —
qualification is counsel's question), `preferredCommonRatioIllustration` (a labeled
illustration leaning on rule `us-fed.reasonable-method`'s caveat that a preferred financing
price is not common FMV), and `grantSanityReport`. Extended with the posture-is-law deep
pass: `PRESUMPTION_METHODS` (the three §409A valuation presumptions as structured, cited
data — independent appraisal; binding formula with the nonlapse-restriction standard; the
illiquid-startup route with its actual regulatory conditions, rules
`us-fed.binding-formula-presumption` and `us-fed.illiquid-startup-presumption`),
`checkMethodEligibility` (explicit inputs only; computed date windows, relayed assertions,
judgments always flag), `refreshTriggerChecklist` (the staleness ceiling, closed
financings, and the term-sheet convention as cited triggers), and
`penaltyIllustration409a` (rule `us-fed.409a-penalty-additions`, IRC §409A(a)(1)(B): the
20% additional tax plus a labeled simple-interest illustration of the underpayment-rate-
plus-one-point premium — explicit hypotheticals in, never a tax computation). OPM,
backsolve, and every other appraisal method are deliberately OUT — `producesValuation`
stays false everywhere. Every check cites a committed rule card
by id — the gate (`lib/openstartup/__tests__/grant409aSanity.test.ts`) fails if a card is
missing or jurisdiction-mismatched — and every finding is `needsReview: true`.

### Vesting mechanics

`lib/openstartup/vesting.ts` — pure, client-safe; real date math
(UTC ISO, anniversaries CLAMPED to short months — the stated convention, plan documents
control). Contract: `vestingEvents` / `vestedAsOf` (cliff + monthly/quarterly/annual
schedules per the Cooley GO founder-stock convention — nothing before the cliff, exactly
the cliff fraction AT it, cumulative-floor rounding with the remainder on the final date),
back-loaded tranche schedules (Amazon's published 5/15/40/40 replayed number-for-number
from the cited Forbes coverage), `cliffVesting`, `departureSummary` (the unvested-repurchase
mechanics at departure — terms stay with the plan documents), `applyAcceleration`
(single- and double-trigger per the Cooley GO definitions; full / %-of-unvested /
months-of-service specs, the double trigger requiring termination to follow the sale),
`portfolioVestedAsOf` (refresh/evergreen grants as additive composition — the Rewarding
Talent practice), `fastAdvisorGrant` (the published FAST agreement grid, encoded and
gate-tested), and `earlyExerciseSnapshot` (the 83(b) interface STATED: restricted-share
counts only; the election window belongs to the deadlines module via rule
`us-fed.83b-filing-period`, and all ISO/NSO/AMT/83(b) tax math belongs to the tax module).
Worked examples and properties in `lib/openstartup/__tests__/vesting.test.ts`.

### Anti-dilution

`lib/openstartup/antiDilution.ts` — pure, client-safe. Contract:
`weightedAverageConversionPrice` (the NVCA model COD formula CP2 = CP1 × (A + B) ÷ (A + C),
also printed by Cooley GO's down-round explainer; broad base via `broadBase` — common +
preferred as-converted + options as-exercised — narrow base = the subject series' own
as-converted common, the denominator difference stated), `fullRatchetConversionPrice`
(Cooley GO's worked example replayed), `applyAntiDilution` (a published worked example
replayed number-for-number for all three bases — the Springmeyer $2.00 → $1.7059 broad /
$1.4444 narrow / $1.00 ratchet down round), conversion-price → conversion-ratio mechanics
(`conversionRatio`, `asConvertedShares`), `payToPlayConsequence` (a flag/explanation per
Fenwick and the Holloway VC guide — never a computed payout), and `toWaterfallSeries`
(the stated waterfall interface: hand the post-adjustment as-converted count as `shares`,
satisfying that module's 1:1 assumption without modifying it). Only dilutive issuances
adjust; exempt-issuance carve-outs are charter text the caller resolves first. Ordering
invariants property-tested (ratchet ≤ narrow ≤ broad ≤ CP1) in
`lib/openstartup/__tests__/antiDilution.test.ts`.

### Priced-round mechanics

`lib/openstartup/round.ts` — pure, client-safe; reuses the
cap-table module's types and pool algebra and composes the anti-dilution module (no
parallel cap-table representation). Contract: `proRataShares` / `maintainOwnership`
(pro rata per the YC User Guide §E — the Appendix II purchase replayed, and the algebra
showing "maintain my %" IS "buy my pro rata of the issuance"), `poolTargetFromHiringPlan`
with `hiringPlanPoolIncrease` / `hiringPlanPoolTopUp` (bottom-up pool sizing per
Rewarding Talent's approach — per-role sizes stay in the book's published grant grids,
supplied as inputs, never invented; the pool algebra is capTable's, already cited),
`downRoundModel` (a dilutive round over snapshot rows composing per-series anti-dilution
adjustments — the Springmeyer example replayed end-to-end, including who absorbs the
dilution), and `founderSecondary` (Cooley GO glossary: a secondary transfers outstanding
shares, issues nothing, dilutes no one — proceeds go to the seller, never the company).
Worked examples in `lib/openstartup/__tests__/round.test.ts`.

### ISO / NSO exercise tax

`lib/openstartup/optionTax.ts` — pure, client-safe. Contract:
`nsoExerciseIncome` (spread-at-exercise ordinary income per Pub 525, rule
`us-fed.nso-spread-ordinary-income`), `supplementalWithholdingIllustration` (the published
22%/37% supplemental rates, asOf-dated — rule `us-fed.supplemental-wage-withholding-2026`),
`isoExerciseOutcome` (§ 421(a) no regular income + the § 56(b)(3) AMT inclusion with dual
basis; the equity lane's early-exercise flag defers the inclusion under § 83 timing),
`iso100kAttribution` (§ 422(d): grant-date FMV, order-granted, NSO spillover and
bifurcation — Treas. Reg. § 1.422-4(d) Examples 1-3 replayed number-for-number),
`isoDisposition` (2y/1y holding periods, § 421(b) disqualifying income, the § 422(c)(2)
loss cap, flagged anniversary boundaries), and `amtExposureIllustration` (a clearly-labeled
ILLUSTRATION whose Rev. Proc. 2024-40 parameters replay every published complete-phaseout
amount; `producesFilingComputation: false` by construction). Vesting-year attribution and
FMVs are inputs — never derived. Tests: `lib/openstartup/__tests__/optionTax.test.ts`.

### 83(b) election math

`lib/openstartup/election83b.ts` — pure, client-safe; the MONEY
only (`deadlines.ts` owns the 30-day clock). Contract: `compare83bScenario` /
`scenarioTax83b` (tax-at-grant vs tax-at-vesting from explicit FMV-trajectory and rate
inputs; the zero-spread founder case flagged — $0 income now), `forfeitureAfterElection`
(no deduction, loss capped at paid − realized, the inclusion never recovered — the cited
risk statement rides on every result), and `earlyExercise83b` (consumes the equity lane's
early-exercise flag; locks NSO income / ISO AMT inclusion at the exercise spread). All six
of Rev. Proc. 2012-29's published examples replayed number-for-number (rule
`us-fed.83b-scenario-arithmetic`) in `lib/openstartup/__tests__/election83b.test.ts`.

### QSBS (§ 1202)

`lib/openstartup/qsbs.ts` — pure, client-safe. Contract:
`qsbsEligibilityChecklist` (C corp, original issuance, the gross-assets test routed by
issuance date, active business ALWAYS needs_review, excluded fields — each a cited
condition, rule `us-fed.qsbs-eligibility`), `qsbsHoldingClock` (the 5-year — or
post-applicable-date 3/4/5-year — clock with the 83(b)/vesting start per rule
`us-fed.restricted-property-holding-period`), `qsbsExclusionPercentage` (50/75/100 by
acquisition date incl. the tiered post-2025 regime, boundaries pinned),
`qsbsPerIssuerCap` (greater of the dollar cap or 10× basis; the standard $2M-basis →
$20M-cap worked example re-derived from § 1202(b)(1)), `qsbsExclusionIllustration`, and
`SECTION_1045_ROLLOVER` (explained, cited, never computed). Tests:
`lib/openstartup/__tests__/qsbs.test.ts`.

### Delaware franchise tax

`lib/openstartup/deFranchiseTax.ts` — pure, client-safe.
Contract: `authorizedSharesMethodTax` and `assumedParValueCapitalTax` (BOTH published
methods computed exactly per 8 Del. C. § 503 and the Division of Corporations' own
calculation page, with the Division's worked examples — 10,005 shares → $335; 100,000 →
$1,015; the $2.061856 assumed-par example → $1,600 — replayed number-for-number; explicit
rounding: 6-decimal half-up assumed par, round-up-to-next-million),
`compareFranchiseTaxMethods` (the March recalculation: which method is cheaper),
`largeCorporateFilerTax` (fixed amount surfaced, qualification unverified), and the
$5,000 quarterly-installment flag. No-par stock refused as out of scope. Rules
`us-de.franchise-tax-authorized-shares-method` / `us-de.franchise-tax-assumed-par-method`;
tests: `lib/openstartup/__tests__/deFranchiseTax.test.ts`.

### R&D tax mechanics

`lib/openstartup/rdCredit.ts` — honest scope: cited explanation +
straight-line arithmetic, never a credit computation. Contract:
`midpointAmortizationSchedule` / `domesticSre5YearSchedule` / `foreignSre15YearSchedule`
(the statutory midpoint convention — the 10/20/20/20/20/10 domestic pattern replayed,
cents-exact), `domesticSre2025Treatment` (§ 174A current deduction or the ≥60-month
election; law-in-flux recorded on the card, never editorialized),
`qsbPayrollOffsetEligibility` (§ 41(h)(3) conditions, always needs_review overall),
`payrollOffsetElectionCap`, and `quarterlyOffsetApplication` (Form 8974:
SS-first-then-Medicare, per-quarter cap, carryforward, conservation-tested). Rules
`us-fed.research-expenditure-amortization` / `us-fed.rd-payroll-offset`; tests:
`lib/openstartup/__tests__/rdCredit.test.ts`.

### Employer payroll tax

`lib/openstartup/payrollTax.ts` — pure, client-safe; FEDERAL
ONLY with the state-tax boundary stated on every result. Contract: `employerFicaAnnual`
(6.2% on the asOf-dated wage base, 1.45% Medicare, the 0.9% Additional Medicare computed
but labeled employee-only withholding — rule `us-fed.fica-rates-2026`), `futaAnnual`
(6.0% on the first $7,000 with the bounded state credit — rule `us-fed.futa-2025`), and
`employerPayrollCostAnnual` (per-employee annual arithmetic + federal-only load factor).
The published maxima are pinned in the tests from the cited figures. Tests:
`lib/openstartup/__tests__/payrollTax.test.ts`.

Still planned: hiring cost comparisons beyond the federal payroll load (benefits and state
payroll-tax load factors need dated rule cards first). The conservative workflow planner
lives in `lib/founderOps.ts` and is gated by `__tests__/founder-ops.test.ts`.

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
