import { evidenceById, verdictFor, type CategoryData } from './data-helpers'
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

export type VerificationMix = Record<Exclude<VerificationLevel, 'unverified'>, number>

// Counts, across every story in a category, how many of a product's verdicts land at each
// verified level (claimed/corroborated/tested/disputed) — `unverified` cells (na/none/uncited)
// are intentionally excluded from the mix since there's nothing to summarize about them. Feeds
// the ArenaTable's "verification mix" mini-chip: a glance at how much of a product's coverage
// is vendor-claim vs independently corroborated/tested vs actively disputed.
export function verificationMix(data: CategoryData, productId: string): VerificationMix {
  const evidence = evidenceById(data)
  const mix: VerificationMix = { 'vendor-claim': 0, corroborated: 0, tested: 0, disputed: 0 }
  for (const story of data.stories) {
    const verdict = verdictFor(data, productId, story.id)
    const level = verificationLevel(verdict, evidence)
    if (level === 'unverified') continue
    mix[level] += 1
  }
  return mix
}
