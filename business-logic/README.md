# Business logic — reusable, testable calculations

Reusable computations and decision support, separate from law (`rules/`) and the vendor
evidence layer (`vendors/`, `data/`). Every module must ship a contract, version, explicit assumptions,
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

Planned next: runway/burn forecasting, deadline calendars (which require dated rule cards, not
hardcoded day counts), and hiring cost comparisons. The conservative workflow planner lives in
`lib/founderOps.ts` and is gated by `__tests__/founder-ops.test.ts`.
