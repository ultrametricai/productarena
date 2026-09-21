'use client'

import Link from 'next/link'
import ProductLogoView from '@/components/ProductLogoView'
import type { ProcessCheckStep } from '@/lib/processCheck'
import { lensGapFor, useProcessLens, type LensSource } from '@/lib/processLens'

// The per-step "ranked for this step" chip row, client-rendered so vendors are SELECTABLE
// (founder 2026-09-21: "if the user clicks a vendor I want it to select using that vendor
// through the process and adapt the DAG to using that"). Replaces the server-rendered chip row
// inside components/ProcessDag.tsx's StepRankingRow — the evidence trail ("how these are
// ranked") stays server-rendered below, unchanged.
//
// Static-HTML contract: the server snapshot (empty lens, stack snapshot '{}') renders the
// serialized default order with no selection styling — IDENTICAL to what a reader without a
// lens or stack sees after hydration, so there is no personalized flash and the SEO HTML stays
// the one shared default view. Only clicks ("use") and "I'm using" stacks change anything,
// entirely client-side via lib/processLens.ts (lens > stack > default).
//
// Each chip keeps its product-page LINK (the judged evidence) and gains a small "use" button —
// the select affordance. The selected vendor pins FIRST: emerald ring + "✓ via" when it came
// from a click, "yours" when it came from the reader's stack. Shutdown vendors never appear in
// these rows (lib/processRankings.ts rankVendors filters offers) and the lens itself refuses to
// resolve to one (lib/processLens.ts) — so nothing shutdown is ever selectable here.
//
// Routes and ceilings never change: the lens adapts WHO executes a step, not what's possible.

// One ranked vendor, serialized server-side by ProcessDag's StepRankingRow from the same
// stepRanking/crossArenaStepRankings data the page always rendered — order preserved.
export interface StepRowVendor {
  productId: string
  arenaId: string
  arenaName: string
  name: string
  score: number
  hasLogo: boolean
  /** Cross-arena option — the chip carries a small tag naming where its judged evidence lives. */
  cross: boolean
  citesTotal: number
  citesFull: number
  citesPartial: number
}

// A curated market entry we don't rank (no judged verdicts) — stays visible as an honest
// unlinked chip after the ranked list, never selectable (no evidence to adapt anything to).
export interface StepRowUntracked {
  vendor: string
  label: string
  hasLogo: boolean
  signupUrl: string | null
}

const CHIP_BASE =
  'inline-flex min-w-0 items-center gap-1.5 rounded-md border py-0.5 pl-0.5 pr-2 transition'
const CHIP_DEFAULT = `${CHIP_BASE} border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-emerald-400/60 hover:text-emerald-300`
const CHIP_SELECTED = `${CHIP_BASE} border-emerald-400/70 bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/40 hover:text-emerald-100`

function SelectedTag({ source }: { source: LensSource }) {
  return (
    <span
      className="rounded bg-emerald-400/15 px-1 py-px text-[9px] font-semibold text-emerald-300"
      title={
        source === 'lens'
          ? 'You selected this vendor — the process is shown as run via it (clear it from the banner above or the ✕)'
          : 'From your "I\'m using" stack — the process is shown as run via your own pick'
      }
    >
      {source === 'lens' ? '✓ via' : 'yours'}
    </span>
  )
}

function VendorChipButton({
  vendor,
  rank,
  selected,
  onSelect,
  onClear,
}: {
  vendor: StepRowVendor
  rank: number | null
  selected: LensSource | null
  onSelect: () => void
  onClear: () => void
}) {
  const title =
    rank === null
      ? `${vendor.name} — your resolved vendor for this step · ${vendor.score.toFixed(0)}/100 from judged verdicts on the mapped ${vendor.arenaName} stories — open the judged product page`
      : `${vendor.name} — #${rank} for this step · ${vendor.score.toFixed(0)}/100 from judged verdicts on ${vendor.citesTotal} mapped ${vendor.arenaName} stories (${vendor.citesFull} full, ${vendor.citesPartial} partial) — expand "how these are ranked" for the full trace, or open the judged product page`
  return (
    <span className="inline-flex min-w-0 items-center gap-0.5">
      <Link
        href={`/arena/${vendor.arenaId}/product/${vendor.productId}`}
        title={title}
        className={selected ? CHIP_SELECTED : CHIP_DEFAULT}
      >
        <ProductLogoView product={{ id: vendor.productId, name: vendor.name }} size={28} hasLogo={vendor.hasLogo} />
        {selected && <SelectedTag source={selected} />}
        <span className="truncate">{vendor.name}</span>
        {vendor.cross && (
          <span className="rounded bg-zinc-800 px-1 py-px text-[9px] uppercase tracking-wide text-zinc-500">
            {vendor.arenaName}
          </span>
        )}
        <span className="font-mono text-[10px] tabular-nums text-emerald-400/80">{vendor.score.toFixed(0)}</span>
      </Link>
      {selected === 'lens' ? (
        <button
          type="button"
          onClick={onClear}
          title={`Stop viewing this process via ${vendor.name}`}
          className="shrink-0 rounded px-0.5 text-[10px] text-zinc-500 transition hover:text-emerald-300"
        >
          ✕
        </button>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          title={`See this process via ${vendor.name} — pins it on every step its ${vendor.arenaName} evidence covers and adapts prompts and API calls (stored in this browser only)`}
          className="shrink-0 rounded px-0.5 text-[10px] text-zinc-600 transition hover:text-emerald-300"
        >
          use
        </button>
      )}
    </span>
  )
}

function UntrackedChip({ info }: { info: StepRowUntracked }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-0.5">
      <span
        title={`${info.label} — not yet judged on ProductArena`}
        className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 py-0.5 pl-0.5 pr-2 text-zinc-400"
      >
        <ProductLogoView product={{ id: info.vendor, name: info.label }} size={28} hasLogo={info.hasLogo} />
        <span className="truncate">{info.label}</span>
      </span>
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

export default function StepVendorRow({
  vendors,
  untracked,
  arenaLink,
  storyCount,
  lensKey,
  checkStep,
}: {
  /** The ranked chips in serialized default order (primary market merged with cross-arena). */
  vendors: StepRowVendor[]
  untracked: StepRowUntracked[]
  /** The primary covering arena for the "full arena →" link — null for extras-only steps. */
  arenaLink: string | null
  storyCount: number
  /** Lens page key: taskId on /processes/[slug], chain id on /processes/chains/[chain]. */
  lensKey?: string
  /** The step's UNCAPPED serialized row (lib/processCheckData.ts) — lets a lens/stack pick
   *  resolve and pin even when it ranks below the display cap. Absent for extras-only steps,
   *  where resolution falls back to the displayed chips. */
  checkStep?: ProcessCheckStep
}) {
  const { lens, stack, setPick, resolveFor } = useProcessLens(lensKey)
  const hasExtras = vendors.some((v) => v.cross)

  // Resolve who executes this step: lens > stack > null (lib/processLens.ts). Extras-only
  // steps have no checkStep — match against the displayed chips with the same precedence.
  const resolved = checkStep
    ? resolveFor(checkStep)
    : (() => {
        const viaLens = vendors.find((v) => lens.picks[v.arenaId] === v.productId)
        if (viaLens) return { vendor: { ...viaLens, hasLogo: viaLens.hasLogo }, source: 'lens' as const }
        const viaStack = vendors.find((v) => stack[v.arenaId] === v.productId)
        return viaStack ? { vendor: { ...viaStack, hasLogo: viaStack.hasLogo }, source: 'stack' as const } : null
      })()

  // Pin the resolved vendor FIRST. When it ranks below the display cap it isn't among the
  // serialized chips — synthesize one from the checkStep row (name/score/hasLogo are there; the
  // cites tooltip needs the expandable, which still names every vendor).
  const pinnedIndex = resolved
    ? vendors.findIndex((v) => v.productId === resolved.vendor.productId && v.arenaId === resolved.vendor.arenaId)
    : -1
  const pinned: StepRowVendor | null = resolved
    ? pinnedIndex >= 0
      ? vendors[pinnedIndex]
      : {
          productId: resolved.vendor.productId,
          arenaId: resolved.vendor.arenaId,
          arenaName: resolved.vendor.arenaName,
          name: resolved.vendor.name,
          score: resolved.vendor.score,
          hasLogo: resolved.vendor.hasLogo === true,
          cross: checkStep
            ? checkStep.arenas.find((a) => a.arenaId === resolved.vendor.arenaId)?.kind === 'extra'
            : false,
          citesTotal: 0,
          citesFull: 0,
          citesPartial: 0,
        }
    : null
  const rest = pinnedIndex >= 0 ? vendors.filter((_, i) => i !== pinnedIndex) : vendors
  const ordered: Array<{ vendor: StepRowVendor; rank: number | null; selected: LensSource | null }> = [
    ...(pinned ? [{ vendor: pinned, rank: pinnedIndex >= 0 ? pinnedIndex + 1 : null, selected: resolved!.source }] : []),
    ...rest.map((v) => ({ vendor: v, rank: vendors.indexOf(v) + 1, selected: null })),
  ]

  // The honest coverage gap: a clicked vendor with NO judged evidence on this step's mapped
  // stories — named, with the step's best beside it, never silently swapped in.
  const gap = checkStep && resolved?.source !== 'lens' ? lensGapFor(checkStep, lens.picks) : null
  const gapName = gap ? lens.names[gap.productId] ?? gap.productId : null

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
      <span
        className="text-[10px] uppercase tracking-wide text-zinc-500"
        title={`Vendors ranked for THIS step — scored from their judged verdicts on the ${storyCount} stories mapped to it${
          hasExtras ? '; vendors from another arena carry a tag naming where their evidence lives' : ''
        } — not the arena's overall PA Score. Click a chip's "use" to see the whole process via that vendor.`}
      >
        ranked for this step:
      </span>
      {ordered.map((e) => (
        <VendorChipButton
          key={`${e.vendor.arenaId}:${e.vendor.productId}`}
          vendor={e.vendor}
          rank={e.rank}
          selected={e.selected}
          onSelect={() => setPick(e.vendor.arenaId, e.vendor.productId, e.vendor.name)}
          onClear={() => setPick(e.vendor.arenaId, null)}
        />
      ))}
      {untracked.map((o) => (
        <UntrackedChip key={o.vendor} info={o} />
      ))}
      {gap && checkStep && (
        <span
          className="text-amber-300/90"
          title={`Your selected vendor has no judged evidence on the ${checkStep.storyCount} stories mapped to this step — the step's best-scored vendor is shown instead of guessing`}
        >
          not covered by {gapName} — best here: {checkStep.best.name} {checkStep.best.score.toFixed(0)}
        </span>
      )}
      {arenaLink && (
        <Link
          href={`/arena/${arenaLink}`}
          title="See the whole judged market for this step's function"
          className="whitespace-nowrap text-[10px] text-zinc-500 transition hover:text-emerald-300"
        >
          full arena →
        </Link>
      )}
    </div>
  )
}
