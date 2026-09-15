import Link from 'next/link'
import type { StoryTierKind } from '@/lib/storyTiers'

// Pricing-tier chip for a classified (story, verdict) cell — the "what can be done for free /
// paid / enterprise" annotation (lib/storyTiers.ts). Outline styling on purpose: the filled
// chips on these rows are verdicts, and a tier must never read as a second verdict. 'unknown'
// (and unclassified) render nothing — absence of stated gating is shown as absence, exactly
// like every other honesty-first surface here.
const TIER_STYLES: Record<Exclude<StoryTierKind, 'unknown'>, string> = {
  free: 'border-emerald-400/60 text-emerald-300',
  paid: 'border-zinc-700 text-zinc-400',
  enterprise: 'border-violet-400/60 text-violet-300',
}

const TIER_TITLES: Record<Exclude<StoryTierKind, 'unknown'>, string> = {
  free: 'free — the cited evidence states this works at no cost',
  paid: 'paid — the cited evidence states this needs a paid plan or usage pricing',
  enterprise: 'enterprise — the cited evidence states this is gated to an enterprise/custom plan',
}

export default function TierChip({
  tier,
  tierNote,
  // Set false when the chip renders inside another link (compare story cells) — nested anchors
  // are invalid; the tooltip still carries the note, only the methodology link is dropped.
  link = true,
}: {
  tier: StoryTierKind | undefined
  tierNote?: string
  link?: boolean
}) {
  if (!tier || tier === 'unknown') return null
  const title = `${tierNote ? `${tierNote} — ` : ''}${TIER_TITLES[tier]}. Annotation from cited evidence only — never affects scores${link ? '; click for methodology' : ''}.`
  const className = `inline-flex shrink-0 items-center rounded-full border px-1.5 py-px font-mono text-[10px] leading-4 ${TIER_STYLES[tier]}`
  if (!link) {
    return (
      <span title={title} className={className}>
        {tier}
      </span>
    )
  }
  return (
    <Link href="/methodology#story-tiers" title={title} className={`${className} transition hover:brightness-125`}>
      {tier}
    </Link>
  )
}
