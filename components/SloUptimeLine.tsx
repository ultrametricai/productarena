import Link from 'next/link'
import {
  formatUptimePct,
  hasMatureSloHistory,
  productSurfaceSlos,
  SLO_SURFACE_LABELS,
  type SloSurface,
  type SurfaceSlo,
} from '@/lib/slo'

// One tiny line in the product header's access area: 30-day uptime of this product's monitored
// agent surfaces (llms.txt / remote MCP / openapi.json — data/slo-history.jsonl via lib/slo.ts,
// grown every 6h by pipeline/scripts/slo-check.ts). Server component; renders nothing when the
// product has no monitored surface. Honesty rule (lib/slo.ts SLO_MIN_TRACKING_DAYS): under a
// week of history the line says "tracking since <date>" — never a percentage computed over a
// couple of checks.
const SURFACE_ORDER: SloSurface[] = ['mcp', 'llms-txt', 'openapi']

function formatDay(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function surfaceText(s: SurfaceSlo, now: Date): string {
  const label = SLO_SURFACE_LABELS[s.surface]
  if (!s.currentlyUp) return `${label} down since ${formatDay(s.downSince ?? s.lastDate)}`
  if (!hasMatureSloHistory(s, now) || s.windowUptimePct === null) return `${label} up`
  return `${label} ${formatUptimePct(s.windowUptimePct)}`
}

export default function SloUptimeLine({ arena, productId }: { arena: string; productId: string }) {
  const now = new Date()
  const slos = productSurfaceSlos(arena, productId, undefined, now).sort(
    (a, b) => SURFACE_ORDER.indexOf(a.surface) - SURFACE_ORDER.indexOf(b.surface),
  )
  if (slos.length === 0) return null

  const allMature = slos.every((s) => hasMatureSloHistory(s, now))
  const since = formatDay(slos.reduce((min, s) => (new Date(s.firstDate) < new Date(min) ? s.firstDate : min), slos[0].firstDate))

  return (
    <p className="mt-1 text-[11px] text-zinc-500">
      <Link
        href="/pipeline#slo"
        title="How we monitor agent surfaces (llms.txt / MCP / openapi.json) — fleet-wide health on /pipeline"
        className="uppercase tracking-widest underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300"
      >
        Agent surface uptime
      </Link>{' '}
      {slos.map((s, i) => (
        <span key={s.surface}>
          {i > 0 && ' · '}
          <span className={`font-mono tabular-nums ${s.currentlyUp ? 'text-zinc-400' : 'text-red-400'}`}>
            {surfaceText(s, now)}
          </span>
        </span>
      ))}{' '}
      <span>({allMature ? '30d, checked every 6h' : 'tracking'} since {since})</span>
    </p>
  )
}
