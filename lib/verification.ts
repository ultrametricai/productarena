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
