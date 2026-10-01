// 409A grant sanity checks — the seventh module of the open-startup toolkit (founder
// direction 2026-10-01: "go further on the business modules").
//
// THIS IS A SANITY MODEL, NOT A VALUATION. It takes a real 409A fair market value as
// INPUT and never invents one — the same posture as equityComp ("takes the FMV as input,
// never invents one"). A credible valuation model needs appraisal methods, comparables,
// and judgment this repo cannot honestly package in a pure function, so this module is
// deliberately the smaller honest version: grant-timing and strike-floor checks against
// dated rule cards, plus comparisons that are clearly labeled illustrations. Every finding
// carries `needsReview: true` and the rule card it leans on.
//
// Pure, client-safe, deterministic; UTC ISO-date arithmetic only. Registered in
// business-logic/README.md; the vitest gate (lib/openstartup/__tests__/grant409aSanity.test.ts)
// asserts every ruleId in RULE_IDS_409A resolves to a committed card in rules/US-FED/.
//
// Rule cards (all citing IRS final regulations under section 409A — source
// `irs-final-reg-409a-2007`, Treas. Reg. § 1.409A-1(b)(5)):
// - us-fed.409a-stock-right-exception: the stock-right exception requires, among other
//   conditions, "an exercise price at least equal to fair market value on the grant date".
// - us-fed.reasonable-method: FMV of non-public stock comes from reasonable application of
//   a reasonable valuation method; caveat: "A financing price for preferred stock does not
//   automatically equal common-stock fair market value."
// - us-fed.staleness: a previously calculated value can be unreasonable if it fails to
//   reflect later material information or "was calculated more than 12 months before the
//   use date"; caveat: twelve months is not guaranteed validity.
// - us-fed.independent-appraisal-presumption: a qualifying independent appraisal dated no
//   more than 12 months before the transaction is one rebuttable presumption of
//   reasonableness — with additional conditions this module does not verify.
// Convention source: YC Post-Money Safe User Guide §B.6 (Feb 2023, verified 2026-10-01):
// "when a company signs a term sheet for a priced round, most 409A valuation firms take
// the position that the then-current 409A price can no longer be used for option grants."
//
// Date conventions (explicit): "12 months" is computed as a UTC calendar-month addition
// (JavaScript month arithmetic; a Feb 29 anniversary rolls to Mar 1). The regulation's day
// counting is a legal question — the boundary cases are exactly why every finding is
// needs-review. Educational model, not legal or tax advice.
// ---------------------------------------------------------------------------

import { roundPrice } from './capTable'

/** The rule cards this module is allowed to cite. The vitest gate asserts every id
 * resolves to a committed card with the matching jurisdiction. */
export const RULE_IDS_409A = {
  strikeFloor: { ruleId: 'us-fed.409a-stock-right-exception', jurisdiction: 'US-FED' },
  reasonableMethod: { ruleId: 'us-fed.reasonable-method', jurisdiction: 'US-FED' },
  staleness: { ruleId: 'us-fed.staleness', jurisdiction: 'US-FED' },
  appraisalPresumption: { ruleId: 'us-fed.independent-appraisal-presumption', jurisdiction: 'US-FED' },
} as const

export type SanityLevel = 'pass' | 'flag' | 'fail'

export interface SanityFinding {
  check: string
  /** pass: the rule's stated condition is met. flag: a judgment call a human must make.
   * fail: the stated condition is tripped as computed. NONE of the three is legal advice
   * or a valuation — hence needsReview on every level. */
  level: SanityLevel
  ruleId: string
  jurisdiction: 'US-FED'
  needsReview: true
  note: string
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function parseIso(date: string, what: string): Date {
  if (!ISO_DATE_RE.test(date)) throw new RangeError(`${what}: expected YYYY-MM-DD, got ${JSON.stringify(date)}`)
  const d = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) {
    throw new RangeError(`${what}: invalid calendar date ${date}`)
  }
  return d
}

/** UTC calendar-month addition (documented convention: Feb 29 + 12 months → Mar 1). */
export function addUtcMonths(iso: string, months: number): string {
  const d = parseIso(iso, 'date')
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate())).toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/**
 * Strike-price floor: the stock-right exception requires an exercise price at least equal
 * to the grant-date FMV — rule `us-fed.409a-stock-right-exception`. Both prices are
 * inputs; the FMV must come from a real 409A valuation. Even a pass is needs-review: the
 * exception has additional conditions (service-recipient stock, no deferral feature) this
 * module does not verify — the card's own caveat.
 */
export function strikeFloorCheck(strikePerShare: number, fmvPerShare: number): SanityFinding {
  if (!(strikePerShare >= 0)) throw new RangeError('strikePerShare must be >= 0')
  if (!(fmvPerShare > 0)) throw new RangeError('fmvPerShare must be > 0 (a real 409A FMV, supplied — never computed here)')
  const ok = strikePerShare >= fmvPerShare
  return {
    check: 'strike-floor',
    level: ok ? 'pass' : 'fail',
    ...RULE_IDS_409A.strikeFloor,
    needsReview: true,
    note: ok
      ? `Strike $${strikePerShare} >= grant-date FMV $${fmvPerShare}. The exception has additional conditions (service-recipient stock, no deferral feature) not verified here.`
      : `Strike $${strikePerShare} is BELOW the grant-date FMV $${fmvPerShare} — the stock-right exception's exercise-price condition is not met as computed. Counsel must review before any grant.`,
  }
}

export interface FmvAgeOptions {
  /** A priced-round term sheet signed after the FMV date: most 409A firms treat it as a
   * material event ending the old price's use for grants — YC User Guide §B.6. */
  termSheetSignedSinceFmv?: boolean
  /** Any other material change since the FMV date (new financing, major contract, ...).
   * 'unknown' is the honest default: whether information is material is a judgment. */
  materialChangeSinceFmv?: boolean | 'unknown'
}

/**
 * FMV staleness at the grant date — rule `us-fed.staleness`: a value "calculated more
 * than 12 months before the use date" can be unreasonable, and so can one that fails to
 * reflect later material information. Twelve months is a ceiling, never a guarantee (the
 * card's caveat), so even an in-window pass is needs-review.
 */
export function fmvAgeCheck(fmvAsOf: string, grantOn: string, options?: FmvAgeOptions): SanityFinding & { staleAfter: string } {
  const fmv = parseIso(fmvAsOf, 'fmvAsOf')
  const grant = parseIso(grantOn, 'grantOn')
  if (grant.getTime() < fmv.getTime()) throw new RangeError('grantOn must be on or after fmvAsOf')
  const staleAfter = addUtcMonths(fmvAsOf, 12)
  const stale = grantOn > staleAfter
  const materialChange = options?.materialChangeSinceFmv ?? 'unknown'
  const termSheet = options?.termSheetSignedSinceFmv ?? false

  let level: SanityLevel
  let note: string
  if (stale) {
    level = 'fail'
    note = `FMV of ${fmvAsOf} is more than 12 months old at the ${grantOn} grant (stale after ${staleAfter}) — the staleness condition is tripped as computed. A fresh determination is needed.`
  } else if (termSheet) {
    level = 'flag'
    note = `FMV is inside the 12-month window, but a priced-round term sheet was signed after ${fmvAsOf}: most 409A valuation firms treat that as a material event ending the old price's use for grants (YC Post-Money Safe User Guide §B.6). Get a fresh determination before granting.`
  } else if (materialChange === true) {
    level = 'flag'
    note = `FMV is inside the 12-month window, but a material change since ${fmvAsOf} was reported: a value that fails to reflect later material information can be unreasonable. Whether the change is reflected is a judgment for counsel and the valuation firm.`
  } else if (materialChange === 'unknown') {
    level = 'flag'
    note = `FMV is inside the 12-month window (stale after ${staleAfter}), but whether material information has arisen since ${fmvAsOf} is unknown — twelve months is not guaranteed validity (rule caveat). Confirm before granting.`
  } else {
    level = 'pass'
    note = `FMV of ${fmvAsOf} is inside the 12-month window at the ${grantOn} grant (stale after ${staleAfter}) and no material change was reported. Twelve months is a ceiling, not a guarantee — the valuation firm confirms continued reliance.`
  }
  return { check: 'fmv-age', level, ...RULE_IDS_409A.staleness, needsReview: true, note, staleAfter }
}

/**
 * Independent-appraisal presumption window — rule `us-fed.independent-appraisal-presumption`:
 * a qualifying appraisal dated no more than 12 months before the grant is ONE rebuttable
 * presumption of reasonableness. This check only tests the window; qualification (the
 * appraiser, the report, the illiquid-startup route's extra conditions) is not verified
 * here — the card's caveat.
 */
export function appraisalPresumptionCheck(appraisalOn: string, grantOn: string): SanityFinding & { windowEnds: string } {
  const appraisal = parseIso(appraisalOn, 'appraisalOn')
  const grant = parseIso(grantOn, 'grantOn')
  if (grant.getTime() < appraisal.getTime()) throw new RangeError('grantOn must be on or after appraisalOn')
  const windowEnds = addUtcMonths(appraisalOn, 12)
  const inWindow = grantOn <= windowEnds
  return {
    check: 'appraisal-presumption-window',
    level: inWindow ? 'pass' : 'fail',
    ...RULE_IDS_409A.appraisalPresumption,
    needsReview: true,
    windowEnds,
    note: inWindow
      ? `Appraisal of ${appraisalOn} is within 12 months of the ${grantOn} grant — the presumption MAY be available. It is rebuttable and has qualification conditions (appraiser, written report, illiquid-startup route limits) not verified here.`
      : `Appraisal of ${appraisalOn} is more than 12 months before the ${grantOn} grant (window ended ${windowEnds}) — the presumption is not available on timing as computed.`,
  }
}

export interface RatioIllustration {
  check: 'preferred-common-ratio'
  kind: 'illustration'
  /** preferred round price / common FMV, rounded to 4 decimals. */
  ratio: number
  level: SanityLevel
  ruleId: string
  jurisdiction: 'US-FED'
  /** This number is NEVER a valuation of anything. */
  producesValuation: false
  needsReview: true
  note: string
}

/**
 * ILLUSTRATION ONLY: how the preferred round price compares to the common 409A FMV.
 * Rule `us-fed.reasonable-method`'s caveat is the whole point: "A financing price for
 * preferred stock does not automatically equal common-stock fair market value" — common
 * pricing below preferred is normal (preferences, participation, control). The ratio is a
 * conversation number for the valuation firm, not a backsolve and not a valuation.
 * Flagged when common FMV is at or above the preferred price — unusual enough to confirm.
 */
export function preferredCommonRatioIllustration(preferredRoundPps: number, fmvPerShare: number): RatioIllustration {
  if (!(preferredRoundPps > 0) || !(fmvPerShare > 0)) throw new RangeError('preferredRoundPps and fmvPerShare must be > 0')
  const ratio = roundPrice(preferredRoundPps / fmvPerShare)
  const unusual = ratio <= 1
  return {
    check: 'preferred-common-ratio',
    kind: 'illustration',
    ratio,
    level: unusual ? 'flag' : 'pass',
    ...RULE_IDS_409A.reasonableMethod,
    producesValuation: false,
    needsReview: true,
    note: unusual
      ? `Common FMV $${fmvPerShare} is at or above the preferred round price $${preferredRoundPps} (ratio ${ratio}) — unusual; confirm the valuation reflects current material information. Illustration only, never a valuation.`
      : `Preferred round price $${preferredRoundPps} is ${ratio}× the common FMV $${fmvPerShare}. A preferred/common gap is normal (preferences, participation, control) — rule caveat: the financing price does not automatically equal common FMV. Illustration only, never a valuation.`,
  }
}

// ---------------------------------------------------------------------------
// The aggregate report
// ---------------------------------------------------------------------------

export interface GrantSanityInputs {
  strikePerShare: number
  /** The company's real 409A FMV per share — SUPPLIED, never computed here. */
  fmvPerShare: number
  /** The FMV's valuation ("as of") date, ISO YYYY-MM-DD. */
  fmvAsOf: string
  /** The intended grant date, ISO YYYY-MM-DD. */
  grantOn: string
  /** Date of the qualifying independent appraisal, if one exists (often = fmvAsOf). */
  independentAppraisalOn?: string
  termSheetSignedSinceFmv?: boolean
  materialChangeSinceFmv?: boolean | 'unknown'
  /** Latest preferred round price per share, for the labeled illustration only. */
  preferredRoundPps?: number
}

export interface GrantSanityReport {
  findings: (SanityFinding | RatioIllustration)[]
  /** The most severe level across findings (fail > flag > pass). */
  worstLevel: SanityLevel
  /** Constant, by construction: this module never values a company. */
  producesValuation: false
  needsReview: true
  disclaimer: string
}

const LEVEL_RANK: Record<SanityLevel, number> = { pass: 0, flag: 1, fail: 2 }

/**
 * Run every applicable check for one intended grant. Output is decision support for a
 * conversation with counsel and the valuation firm — it never authorizes a grant, never
 * computes an FMV, and keeps `needsReview: true` on every finding (the business-logic
 * README contract).
 */
export function grantSanityReport(inputs: GrantSanityInputs): GrantSanityReport {
  const findings: (SanityFinding | RatioIllustration)[] = [
    strikeFloorCheck(inputs.strikePerShare, inputs.fmvPerShare),
    fmvAgeCheck(inputs.fmvAsOf, inputs.grantOn, {
      termSheetSignedSinceFmv: inputs.termSheetSignedSinceFmv,
      materialChangeSinceFmv: inputs.materialChangeSinceFmv,
    }),
  ]
  if (inputs.independentAppraisalOn !== undefined) {
    findings.push(appraisalPresumptionCheck(inputs.independentAppraisalOn, inputs.grantOn))
  }
  if (inputs.preferredRoundPps !== undefined) {
    findings.push(preferredCommonRatioIllustration(inputs.preferredRoundPps, inputs.fmvPerShare))
  }
  const worstLevel = findings.reduce<SanityLevel>(
    (worst, f) => (LEVEL_RANK[f.level] > LEVEL_RANK[worst] ? f.level : worst),
    'pass',
  )
  return {
    findings,
    worstLevel,
    producesValuation: false,
    needsReview: true,
    disclaimer:
      'Sanity checks against dated rule cards — not a valuation, not legal or tax advice, and never an authorization to grant. The 409A FMV is an input this module cannot produce.',
  }
}
