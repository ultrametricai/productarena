'use client'

import Link from 'next/link'
import ProductLogoView from '@/components/ProductLogoView'
import { stackPicks } from '@/lib/myStack'
import type { ProcessCheckStep } from '@/lib/processCheck'
import { useProcessLens } from '@/lib/processLens'
import type { VendorChipInfo } from '@/lib/processes'

// The canonical vendor chip for a step that HAS a market (a ranked row or a "via:" roster
// beneath it). Founder 2026-09-23: "processes don't start with just one supplier — the first
// step is to SELECT a supplier on almost all of these — unless you have done so already."
//
// So the canonical vendor never reads as THE step's vendor when the reader hasn't picked one:
//   - NO lens/stack pick covering the step → the chip demotes to an "e.g."-prefixed reference
//     chip (muted, still linked to the judged product page) and the market row stays primary.
//     This IS the static HTML: the server snapshots of lens ('{}') and stack ('{}') are empty,
//     so SSR always renders this view — no personalized flash, SEO HTML unchanged per reader.
//   - a pick EXISTS and covers the step → this chip renders nothing: the resolved pick is
//     already pinned first in the ranked row ("✓ via" / "yours"), and keeping the canonical
//     vendor beside it would still read as "the" vendor next to the reader's own.
//
// Steps WITHOUT a market (genuinely vendor-locked: IRS, Delaware portal…) never render this
// component — components/ProcessDag.tsx keeps their full-strength server chip.

const EG_TITLE =
  "no supplier selected — this is the market's reference vendor; pick yours above or click a chip"

export default function StepCanonicalVendor({
  info,
  logo,
  marketArenaId,
  topRankedId,
  lensKey,
  checkStep,
}: {
  info: VendorChipInfo
  /** Server-resolved (lib/logos.ts hasLogo) — client components can't touch the filesystem. */
  logo: boolean
  /** The step's covering market arena (optionsArenaId, else the canonical vendor's own arena)
   *  — the fallback pick check for steps without a serialized checkStep row. */
  marketArenaId: string | null
  /** The #1 product of the step's ranked row — when the canonical vendor IS the top-ranked
   *  chip, the reference chip would show it twice (founder 2026-09-23), so it renders nothing. */
  topRankedId?: string | null
  lensKey?: string
  checkStep?: ProcessCheckStep
}) {
  const { lens, stack, resolveFor } = useProcessLens(lensKey)
  // A pick that covers the step hides the reference chip. With a serialized row the resolution
  // is exact (lens > stack, coverage-gated — lib/processLens.ts); without one, any lens/stack
  // pick for the step's market arena counts: the reader has told us their supplier, so the
  // reference vendor must not keep rendering beside their choice.
  const covered = checkStep
    ? resolveFor(checkStep) !== null
    : marketArenaId !== null &&
      (lens.picks[marketArenaId] !== undefined || stackPicks(stack, marketArenaId).length > 0)
  if (covered) return null
  // Founder 2026-09-23: never show the step's top vendor twice — the ranked row already leads
  // with it.
  if (topRankedId && info.productId === topRankedId) return null

  const body = (
    <>
      <ProductLogoView
        product={{ id: info.productId ?? info.vendor, name: info.label }}
        size={28}
        hasLogo={logo}
      />
      <span className="truncate">{info.label}</span>
    </>
  )
  const chipTitle = `${info.label} — ${EG_TITLE}`
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span aria-hidden className="text-[10px] italic text-zinc-500" title={EG_TITLE}>
        e.g.
      </span>
      {info.productId && info.arenaId ? (
        <Link
          href={`/arena/${info.arenaId}/product/${info.productId}`}
          title={chipTitle}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 py-0.5 pl-0.5 pr-2 text-zinc-400 transition hover:border-emerald-400/50 hover:text-emerald-300"
        >
          {body}
        </Link>
      ) : (
        <span
          title={chipTitle}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 py-0.5 pl-0.5 pr-2 text-zinc-400"
        >
          {body}
        </span>
      )}
      {info.signupUrl && (
        <a
          href={info.signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${info.label}'s own start page — ${new URL(info.signupUrl).hostname.replace(/^www\./, '')} (external)`}
          className="shrink-0 rounded px-0.5 text-[10px] text-zinc-500 transition hover:text-emerald-300"
        >
          ↗
        </a>
      )}
    </span>
  )
}
