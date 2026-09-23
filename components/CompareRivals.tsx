import Link from 'next/link'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import GeoMark from '@/components/GeoMark'
import ProductLogo from '@/components/ProductLogo'
import ShutdownBadge from '@/components/ShutdownBadge'
import { compareRivalsFor, vsSlugFor, type CompareRivalRow } from '@/lib/compareRivals'
import type { CategoryData } from '@/lib/data-helpers'

// Server component: "How it compares" — the founder ask (2026-09-22): a product page shows a
// comparison table of its similar products. "Similar" here is leaderboard adjacency in the
// product's OWN arena (lib/compareRivals.ts: 2 above + 2 below, edge-filled), a deliberately
// FOCUSED slice of the arena leaderboard — same judged numbers, same n/a rules, none of
// ArenaTable's sorting/filtering/preset machinery. Shutdown rivals keep their row with the
// Closing tag (list semantics, lib/shutdown.ts); each rival's "vs" cell links to the judged
// /vs/ head-to-head with this product. Renders nothing for arenas with fewer than 2 products.

// Per-dimension receipt anchors on the product's /score page — the same anchors the header's
// AgenticBadge trio links to (app/arena/[category]/product/[id]/page.tsx).
const DIMS: Array<{
  key: 'agentReady' | 'agenticApp' | 'apiQuality'
  label: string
  anchor: string
  headerTitle: string
  hideBelow?: string
}> = [
  {
    key: 'agentReady',
    label: 'Agent-ready',
    anchor: 'agent-ready',
    headerTitle:
      'AGENT-READY = outside-in: can YOUR agent drive this product? Measures the access surface — API, MCP, CLI, headless runs, agent docs. Click a score for its judged receipt.',
  },
  {
    key: 'agenticApp',
    label: 'Built-in AI',
    anchor: 'built-in-ai',
    headerTitle:
      'BUILT-IN AI = inside-out: how agentic the product itself is FOR its users — built-in assistants, autonomous features, AI-first workflows. Click a score for its judged receipt.',
    hideBelow: 'sm',
  },
  {
    key: 'apiQuality',
    label: 'API',
    anchor: 'api-quality',
    headerTitle:
      'API quality /100 — machine-readable spec, interactive docs, sandbox, versioning discipline. Click a score for its judged receipt.',
    hideBelow: 'md',
  },
]

const NA_CELL_TITLE =
  "Not meaningful for this arena's product class — a physical part has no agent-drivable surface or API of its own. The PA Score still applies; see the arena methodology note."

function ScoreCell({
  row,
  arenaId,
  dim,
  na,
}: {
  row: CompareRivalRow
  arenaId: string
  dim: (typeof DIMS)[number]
  na: boolean
}) {
  if (na) {
    return (
      <span className="text-zinc-600" title={NA_CELL_TITLE}>
        n/a
      </span>
    )
  }
  const value = row[dim.key]
  if (value === null) return <span className="text-zinc-500">n/a</span>
  return (
    <Link
      href={`/arena/${arenaId}/product/${row.productId}/score#${dim.anchor}`}
      title={`${row.name}'s ${dim.label} score — click for the judged receipt: the exact stories, verdicts, and evidence behind it`}
      className="hover:text-emerald-300"
    >
      {value.toFixed(0)}
      <span className="text-zinc-600">/100</span>
    </Link>
  )
}

export default function CompareRivals({ data, productId }: { data: CategoryData; productId: string }) {
  const rows = compareRivalsFor(data, productId)
  if (rows.length < 2) return null
  const selfName = rows[0].name
  const naDims = new Set(data.category.naDimensions ?? [])
  const hide: Record<string, string> = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell' }

  return (
    <div id="compare-rivals" className="scroll-mt-4">
      <h2 className="font-display leading-[1.1] mb-1 flex items-center gap-2 text-lg font-semibold">
        <GeoMark
          seed="compare-rivals"
          title="How it compares — this product against its nearest arena rivals by leaderboard rank, from the same judged scores as the full leaderboard"
          size={18}
          className="text-zinc-500"
        />
        How it compares
      </h2>
      <p className="mb-3 text-sm text-zinc-500">
        {selfName} against its nearest {data.category.name} rivals by arena rank — same judged
        scores as the full leaderboard, plus each pair&rsquo;s head-to-head record.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
              <th scope="col" className="px-2 py-1.5 font-normal">
                <span title="This product (highlighted) plus its nearest rivals by arena leaderboard rank — # is each product's rank in the full arena">Product</span>
              </th>
              <th scope="col" className="px-2 py-1.5 font-normal">
                <span title="PA Score /100 — the blended headline score: agent-ready ×0.30, API quality ×0.20, openness ×0.20, Built-in AI ×0.15, automation ×0.15. Click a score for its full receipt.">PA Score</span>
              </th>
              {DIMS.map((dim) => (
                <th key={dim.key} scope="col" className={`px-2 py-1.5 font-normal ${dim.hideBelow ? hide[dim.hideBelow] : ''}`}>
                  <span title={dim.headerTitle}>{dim.label}</span>
                </th>
              ))}
              <th scope="col" className="hidden px-2 py-1.5 font-normal sm:table-cell">
                <span title="Agent access surfaces — MCP server / CLI / API, from judged evidence: ✓ full, ~ partial, ! disputed, — none found. Each glyph links to its story's evidence.">Access</span>
              </th>
              <th scope="col" className="px-2 py-1.5 font-normal">
                <span title={`Judged head-to-head vs ${selfName}: ${selfName}'s round wins first, the rival's second (drawn rounds in the tooltip). Click for every judged round.`}>vs</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {rows.map((row) => (
              <tr
                key={row.productId}
                className={row.isSelf ? 'bg-emerald-500/5' : 'transition hover:bg-zinc-800/70'}
              >
                <td className="min-w-[200px] max-w-[300px] px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 shrink-0 font-mono text-xs tabular-nums text-zinc-500"
                      title={`#${row.rank} in the ${data.category.name} arena leaderboard`}
                    >
                      #{row.rank}
                    </span>
                    {row.isSelf ? (
                      <span
                        className="flex min-w-0 items-center gap-2 font-medium text-emerald-300"
                        title={`${row.name} — the product this page is about`}
                      >
                        <ProductLogo product={data.products.find((p) => p.id === row.productId)!} size={24} />
                        <span className="truncate">{row.name}</span>
                      </span>
                    ) : (
                      <Link
                        href={`/arena/${data.category.id}/product/${row.productId}`}
                        title={`${row.name} — see its full product page`}
                        className="flex min-w-0 items-center gap-2 font-medium hover:text-emerald-300"
                      >
                        <ProductLogo product={data.products.find((p) => p.id === row.productId)!} size={24} />
                        <span className="truncate">{row.name}</span>
                      </Link>
                    )}
                    <ShutdownBadge shutdown={row.shutdown} source={row.shutdownSource} />
                  </div>
                </td>
                <td className="px-2 py-2 font-mono tabular-nums text-zinc-300">
                  {row.aiEra === null ? (
                    <span className="text-zinc-500">n/a</span>
                  ) : (
                    <Link
                      href={`/arena/${data.category.id}/product/${row.productId}/score`}
                      title={`${row.name}'s PA Score — click for the full receipt: every dimension, story, verdict, and evidence behind it`}
                      className="hover:text-emerald-300"
                    >
                      {row.aiEra.toFixed(0)}
                      <span className="text-zinc-600">/100</span>
                    </Link>
                  )}
                </td>
                {DIMS.map((dim) => (
                  <td
                    key={dim.key}
                    className={`px-2 py-2 font-mono tabular-nums text-zinc-300 ${dim.hideBelow ? hide[dim.hideBelow] : ''}`}
                  >
                    <ScoreCell row={row} arenaId={data.category.id} dim={dim} na={naDims.has(dim.key)} />
                  </td>
                ))}
                <td className="hidden px-2 py-2 sm:table-cell">
                  <AgentAccessGlyphs data={data} productId={row.productId} />
                </td>
                <td className="whitespace-nowrap px-2 py-2 font-mono text-xs tabular-nums">
                  {row.isSelf || !row.battleSlug ? (
                    <span className="text-zinc-600" aria-hidden>
                      —
                    </span>
                  ) : (
                    <Link
                      href={`/vs/${row.battleSlug}`}
                      title={
                        row.record
                          ? `${selfName} ${row.record.wins} – ${row.record.losses} ${row.name}${row.record.draws > 0 ? ` (${row.record.draws} drawn)` : ''} — judged story by story; click for every round`
                          : `${selfName} vs ${row.name} — the judged head-to-head, story by story`
                      }
                      className="text-zinc-400 hover:text-emerald-300"
                    >
                      {row.record ? `${row.record.wins}–${row.record.losses}` : 'vs'} ↗
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Founder 2026-09-23: the head-to-head links live under this table (moved from the top
          actions rail) — every same-arena rival's /vs page plus the alternatives directory. */}
      <div className="mt-3 text-xs">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Compare head-to-head</p>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5">
          {data.products
            .filter((p) => p.id !== productId)
            .map((rival) => (
              <Link
                key={rival.id}
                href={`/vs/${vsSlugFor(data, productId, rival.id)}`}
                className="inline-flex items-center gap-1.5 text-zinc-400 transition hover:text-emerald-300"
              >
                <ProductLogo product={rival} size={16} />
                vs {rival.name}
              </Link>
            ))}
        </div>
        <p className="mt-1.5">
          <Link href={`/alternatives/${productId}`} className="text-zinc-400 hover:text-emerald-300">
            Alternatives to {data.products.find((p) => p.id === productId)?.name ?? productId} →
          </Link>
        </p>
      </div>
      <div className="mt-2 text-xs">
        <Link
          href={`/arena/${data.category.id}`}
          title={`The full ${data.category.name} arena — every ranked product, sortable`}
          className="text-zinc-400 hover:text-emerald-300"
        >
          full arena →
        </Link>
      </div>
    </div>
  )
}
