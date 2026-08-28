import type { Evidence, Verdict } from './schemas'

export type VerificationLevel = 'unverified' | 'vendor-claim' | 'corroborated' | 'tested' | 'disputed'

// Derived, non-LLM signal for how a verdict was substantiated: purely a function of the
// verdict's own tier plus the tiers of the evidence it cites. Never changes verdicts/scores —
// it's a read of the same data the judge already produced.
export function verificationLevel(verdict: Verdict, evidence: Map<string, Evidence>): VerificationLevel {
  if (verdict.verdict === 'disputed') return 'disputed'
  if (verdict.verdict === 'na' || verdict.verdict === 'none' || verdict.evidenceIds.length === 0) {
    return 'unverified'
  }

  const tiers = verdict.evidenceIds.map((id) => evidence.get(id)?.tier)
  if (tiers.includes('probe')) return 'tested'
  if (tiers.includes('community')) return 'corroborated'
  return 'vendor-claim'
}

// Evidence-strength ladder, strongest first: a direct hands-on probe outranks a github
// README, which outranks independent community commentary, which outranks the vendor's own
// claimed docs. Used to pick the single best "proof ↗" link for a verdict (see ContestLink's
// neighbors on the product page, StoryMatrix cells, and BattleView cards) — distinct from
// verificationLevel's coarser tiering (which lumps github in with claimed-docs).
const EVIDENCE_LADDER: Array<Evidence['tier']> = ['probe', 'github', 'community', 'claimed-docs']

// Highest-tier cited evidence for a verdict, or null if the verdict cites nothing resolvable.
// Within a tier, the first citation (in the verdict's own evidenceIds order) wins.
export function strongestEvidence(verdict: Verdict, evidence: Map<string, Evidence>): Evidence | null {
  const cited = verdict.evidenceIds
    .map((id) => evidence.get(id))
    .filter((e): e is Evidence => e !== undefined)
  for (const tier of EVIDENCE_LADDER) {
    const match = cited.find((e) => e.tier === tier)
    if (match) return match
  }
  return null
}
