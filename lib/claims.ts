// Pure helpers reconciling a product's vendor CLAIMS (lib/schemas.ts's ClaimSchema, extracted by
// pipeline/stages/claims.ts from claimed-docs/github evidence) against our judge's own VERDICTS
// for the same story. A claim is what the vendor says; a verdict is what we independently found —
// this module is the diff between the two.
import { evidenceById, verdictFor, type CategoryData } from './data-helpers'
import type { Claim } from './schemas'
import { verificationLevel } from './verification'

export type ClaimStatus =
  | 'claimed-verified' // claim maps to this story AND the verdict is full/partial with corroborated/tested verification
  | 'claimed-unverified' // claim maps to this story, verdict is full/partial but only vendor-claim evidence backs it
  | 'claimed-contradicted' // claim maps to this story, but the verdict is disputed/none/na
  | 'delivered-unclaimed' // no claim covers this story, but the verdict is full/partial anyway ("undersold")
  | 'unclaimed-none' // no claim, and nothing delivered either

// Every claim-status bucket, in the order the product page renders them.
export const CLAIM_STATUSES: ClaimStatus[] = [
  'claimed-verified', 'claimed-unverified', 'claimed-contradicted', 'delivered-unclaimed', 'unclaimed-none',
]

// Whether any claim for `productId` maps onto `storyId` — a story can be covered by more than
// one claim (rare but legal), so this only needs to know "covered or not", not by which one.
function isClaimed(claims: Claim[], storyId: string): boolean {
  return claims.some((c) => c.storyIds.includes(storyId))
}

export function claimStatus(data: CategoryData, productId: string, storyId: string): ClaimStatus {
  const claims = data.claims[productId] ?? []
  const verdict = verdictFor(data, productId, storyId)
  const delivering = verdict.verdict === 'full' || verdict.verdict === 'partial'

  if (!isClaimed(claims, storyId)) {
    return delivering ? 'delivered-unclaimed' : 'unclaimed-none'
  }
  if (!delivering) return 'claimed-contradicted'

  const level = verificationLevel(verdict, evidenceById(data))
  return level === 'corroborated' || level === 'tested' ? 'claimed-verified' : 'claimed-unverified'
}

export type ClaimBucketCounts = Record<ClaimStatus, number>

// Counts every story's claimStatus for one product — backs the product page's four-bucket
// summary and the arena scoreboard chip's "{verified}/{claimed} claims verified" figure.
export function claimBucketCounts(data: CategoryData, productId: string): ClaimBucketCounts {
  const counts: ClaimBucketCounts = {
    'claimed-verified': 0, 'claimed-unverified': 0, 'claimed-contradicted': 0,
    'delivered-unclaimed': 0, 'unclaimed-none': 0,
  }
  for (const story of data.stories) {
    counts[claimStatus(data, productId, story.id)] += 1
  }
  return counts
}

// Total claims that map to at least one story, for a product — the denominator half of
// "{verified}/{claimed} claims verified".
export function claimedStoryCount(counts: ClaimBucketCounts): number {
  return counts['claimed-verified'] + counts['claimed-unverified'] + counts['claimed-contradicted']
}

// Claims that don't map onto any story in the current taxonomy — surfaced as "claims outside our
// story set" on the product page: real feedback that the taxonomy is missing an axis, not noise.
export function unmappedClaims(data: CategoryData, productId: string): Claim[] {
  return (data.claims[productId] ?? []).filter((c) => c.storyIds.length === 0)
}
