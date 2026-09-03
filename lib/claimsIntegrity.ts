// The Claims-vs-Reality integrity index: one number per product for "does the vendor's website
// deliver what it promises?", built on lib/claims.ts's reconciliation of vendor CLAIMS against
// our judge's independent VERDICTS.
//
// Formula (documented in README's "Claims vs reality" methodology subsection):
//
//   testable  = verified + unverified + contradicted        (claims mapped onto a story)
//   integrity = 100 × max(0, verified − 2 × contradicted) / testable
//
// - verified claims (claimed-verified) count fully;
// - unverified claims (claimed-unverified — full/partial verdict but only vendor-claim
//   evidence) count for nothing: they inflate the denominator only;
// - contradicted claims (claimed-contradicted) count NEGATIVELY, each one cancelling two
//   verified claims — overpromising is worse than staying silent — with the score clamped
//   at 0;
// - untestable claims (storyIds: [] — outside this arena's story taxonomy, see
//   lib/claims.ts's unmappedClaims) are excluded from both numerator and denominator: a
//   taxonomy gap is feedback on the taxonomy, never a mark for or against the product.
//
// Null-vs-zero (repo convention, same as claimsVerifiedPercent / weightedPercent): `score` is
// null — never a fabricated 0 — when the product has no claims data or no testable claims.
// "We don't know" is not "the worst", and nulls sort last in every ranked view.
import { claimBucketCounts, unmappedClaims } from './claims'
import type { CategoryData } from './data-helpers'

export interface ClaimsIntegrity {
  /** 0–100 integrity score, or null when the product has no testable claims at all. */
  score: number | null
  /** claimed-verified — claim maps to a story whose verdict is corroborated/tested full/partial. */
  verified: number
  /** claimed-unverified — full/partial verdict, but only the vendor's own claim backs it. */
  unverified: number
  /** claimed-contradicted — claim maps to a story our judge found disputed/none/na. */
  contradicted: number
  /** Claims outside the story taxonomy (storyIds: []) — excluded from the score entirely. */
  untestable: number
  /** verified + unverified + contradicted + untestable. */
  total: number
}

export function claimsIntegrity(data: CategoryData, productId: string): ClaimsIntegrity {
  const counts = claimBucketCounts(data, productId)
  const verified = counts['claimed-verified']
  const unverified = counts['claimed-unverified']
  const contradicted = counts['claimed-contradicted']
  const untestable = unmappedClaims(data, productId).length
  const testable = verified + unverified + contradicted
  const score = testable === 0 ? null : Math.round((100 * Math.max(0, verified - 2 * contradicted)) / testable)
  return { score, verified, unverified, contradicted, untestable, total: testable + untestable }
}
