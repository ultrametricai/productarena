import type { CoverageSurface } from '@/lib/storyCoverage'

// One evidence-surface chip (lib/storyCoverage.ts): the docs area / API section / community
// source a verdict's cited evidence came from, linking to the actual evidence URL. Tier-tinted
// with the site's evidence vocabulary — probe emerald (we ran it), github violet (repo code),
// community sky (independent users), claimed-docs zinc (the vendor's own word). No 'use client'
// directive: it's a plain anchor, renderable from both the server Coverage map section and the
// client StoryVerdictsTable's expanded rows.

const TIER_CHIP: Record<CoverageSurface['tier'], string> = {
  probe: 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300 hover:border-emerald-400/70',
  github: 'border-violet-400/40 bg-violet-400/5 text-violet-300 hover:border-violet-400/70',
  community: 'border-sky-400/40 bg-sky-400/5 text-sky-300 hover:border-sky-400/70',
  'claimed-docs': 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500',
}

// Same plain-language tier glosses as the rest of the site (Legend, VerificationBadge).
const TIER_GLOSS: Record<CoverageSurface['tier'], string> = {
  probe: 'probed — we tested this surface ourselves',
  github: 'github — backed by repository code',
  community: 'community — independent users report it',
  'claimed-docs': 'claimed — the vendor’s own docs',
}

export default function SurfaceChip({ surface }: { surface: CoverageSurface }) {
  return (
    <a
      href={surface.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${TIER_GLOSS[surface.tier]} · ${surface.url}`}
      className={`inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-xs transition ${TIER_CHIP[surface.tier]}`}
    >
      {surface.label}
    </a>
  )
}
