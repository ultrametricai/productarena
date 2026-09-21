import Link from 'next/link'
import GeoMark from '@/components/GeoMark'
import { phaseIcon, phaseTooltip } from '@/lib/processIcons'
import { processesForVendor, type VendorProcessAppearance } from '@/lib/vendorProcesses'

// Server component: "Processes this product serves" — the founder ask (2026-09-21): every
// company/product page lists the founder processes it comes up in, clicking through to the
// process pages. Rows come straight from lib/vendorProcesses.ts's reverse index over the SAME
// derivations the process pages render (processLeaderboard, cross-arena rankings, computer-use
// options, canonical vendors, grounded API calls), so the two surfaces can never disagree.
// Renders nothing for the many products no process ever surfaces.
//
// Grouping: judged-SERVING appearances (a judged step score or a canonical/API-call role) lead
// the table, capped at 8 visible rows; the rest — including every computer-use-only appearance
// (browser agents surface on ~100 manual steps as "could attempt it today", which is not
// "serves it") — collapse into a native <details> (static-export safe, the CoverageMapSection
// pattern) whose summary always counts them out loud.

const VISIBLE_ROWS = 8

const BEST_SCORE_TITLE =
  'Its best judged step score in this process — weightedPercent over the stories our step→story '
  + 'mapping deems relevant to the step, derived purely from the arena\'s judged verdicts '
  + '(full/partial/disputed/none), /100. Same number the process page\'s step pills show.'

// A computer-use-ONLY appearance: the vendor never serves a step here, it could merely attempt
// a manual one. These never take a visible row — collapsed, counted honestly.
function isComputerUseOnly(a: VendorProcessAppearance): boolean {
  return a.kinds.length === 1 && a.kinds[0] === 'computer-use'
}

// Compact role line, mirroring the process page's own framing of each appearance kind.
function roleText(a: VendorProcessAppearance): string {
  const parts: string[] = []
  if (a.leaderboardRank !== null) {
    parts.push(`#${a.leaderboardRank} for this process · ${a.stepsServed}/${a.rankableSteps} steps`)
  } else if (a.kinds.includes('cross-arena')) {
    parts.push('cross-arena option')
  }
  if (a.kinds.includes('canonical')) parts.push('canonical vendor')
  if (parts.length === 0 && a.kinds.includes('api-calls')) parts.push('grounded API calls')
  if (parts.length === 0) parts.push('🖥 computer-use attempt')
  return parts.join(' · ')
}

function roleTitle(a: VendorProcessAppearance): string {
  const why: Record<string, string> = {
    'step-ranked': 'it has a judged step score on the process\'s own step rankings',
    'cross-arena': 'it surfaces on a step as an evidence-gated cross-arena option',
    'computer-use': 'it could attempt a manual step of this process today (judged computer-use evidence — not coverage)',
    canonical: 'a step names it as the canonical call target',
    'api-calls': 'it has grounded per-step API calls on this process',
  }
  return `How this product comes up here: ${a.kinds.map((k) => why[k]).join('; ')}.`
}

function AppearanceRows({ rows }: { rows: VendorProcessAppearance[] }) {
  return (
    <>
      {rows.map((a) => (
        <tr key={a.taskId} className="transition hover:bg-zinc-800/70">
          <td className="max-w-[280px] px-2 py-1.5">
            <Link
              href={`/processes/${a.slug}`}
              title={`${a.title} — see the full process page: the step DAG, ranked vendors per step, and the process leaderboard`}
              className="flex items-center gap-1.5 font-medium hover:text-emerald-300"
            >
              {a.icon && <span aria-hidden>{a.icon}</span>}
              <span className="truncate">{a.title}</span>
            </Link>
          </td>
          <td className="px-2 py-1.5 text-xs text-zinc-400">
            <span title={phaseTooltip(a.phase)}>
              {phaseIcon(a.phase) && <span aria-hidden className="mr-1">{phaseIcon(a.phase)}</span>}
              {a.phase}
            </span>
          </td>
          <td className="px-2 py-1.5 text-xs text-zinc-300">
            <span title={roleTitle(a)}>{roleText(a)}</span>
          </td>
          <td className="px-2 py-1.5 font-mono text-xs tabular-nums text-zinc-300">
            {a.bestStepScore === null ? (
              <span className="italic text-zinc-500">—</span>
            ) : (
              <span title={BEST_SCORE_TITLE}>
                {a.bestStepScore}
                <span className="text-zinc-600">/100</span>
              </span>
            )}
          </td>
        </tr>
      ))}
    </>
  )
}

function AppearanceTable({ rows }: { rows: VendorProcessAppearance[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 md:overflow-x-visible">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
            <th scope="col" className="px-2 py-1.5 font-normal"><span title="The founder process this product comes up in — links to its process page">Process</span></th>
            <th scope="col" className="px-2 py-1.5 font-normal"><span title="Company-lifecycle phase the process belongs to">Phase</span></th>
            <th scope="col" className="px-2 py-1.5 font-normal"><span title="How this product comes up: its process-leaderboard rank and step coverage, or a cross-arena / computer-use / canonical role">Role</span></th>
            <th scope="col" className="px-2 py-1.5 font-normal"><span title={BEST_SCORE_TITLE}>Best step score</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          <AppearanceRows rows={rows} />
        </tbody>
      </table>
    </div>
  )
}

export default function VendorProcesses({
  arenaId,
  productId,
  productName,
}: {
  arenaId: string
  productId: string
  productName: string
}) {
  const appearances = processesForVendor(arenaId, productId)
  if (appearances.length === 0) return null

  const serving = appearances.filter((a) => !isComputerUseOnly(a))
  const cuOnly = appearances.filter(isComputerUseOnly)
  const visible = serving.slice(0, VISIBLE_ROWS)
  const overflow = [...serving.slice(VISIBLE_ROWS), ...cuOnly]

  return (
    <div id="processes" className="scroll-mt-4">
      <h2 className="font-display leading-[1.1] mb-1 flex items-center gap-2 text-lg font-semibold">
        <GeoMark
          seed="vendor-processes"
          title="Processes — the founder operating processes this product comes up in, from the same story-derived rankings the process pages show"
          size={18}
          className="text-zinc-500"
        />
        Processes this product serves
      </h2>
      <p className="mb-3 text-sm text-zinc-500">
        Where {productName} comes up across our{' '}
        <Link href="/processes" className="text-zinc-400 underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300">
          founder operating processes
        </Link>
        {' '}— same judged, story-derived step rankings the process pages show, in reverse.
      </p>
      {visible.length > 0 && <AppearanceTable rows={visible} />}
      {overflow.length > 0 && (
        <details className={visible.length > 0 ? 'mt-2' : ''}>
          <summary className="cursor-pointer select-none text-xs text-zinc-400 transition hover:text-emerald-300">
            {overflow.length}{visible.length > 0 ? ' more' : ''} {overflow.length === 1 ? 'process' : 'processes'}
            {cuOnly.length > 0 && (
              <span className="text-zinc-500">
                {' '}— {cuOnly.length === overflow.length ? 'all' : cuOnly.length} computer-use-only:
                judged &ldquo;could attempt a manual step today&rdquo; evidence, not step coverage
              </span>
            )}
          </summary>
          <div className="mt-2">
            <AppearanceTable rows={overflow} />
          </div>
        </details>
      )}
    </div>
  )
}
