import type { Metadata } from 'next'
import Link from 'next/link'
import EverythingCatalog from '@/components/EverythingCatalog'
import { loadAll } from '@/lib/data'
import {
  buildEverythingLensRows,
  buildEverythingProcessRows,
  buildEverythingRows,
  buildEverythingStackRows,
} from '@/lib/everything'
import { collectGlobalStories } from '@/lib/globalStories'

export const metadata: Metadata = {
  title: 'Everything — ProductArena',
  description:
    'The power view: the whole catalog on one page. Every ranked product with bare scores and access glyphs, every founder process with its agent ceiling, every stack, every ICP lens, and a link index to the rest of the site.',
}

// The /everything power view — one deliberately long, deliberately dense page: maximum
// information per viewport, every row a link, no big pills or badges. The product catalog is the
// page's only client component (facet bar + filtering, see components/EverythingCatalog.tsx);
// processes, stacks, lenses, and the link index render server-side and never hydrate.
export default function EverythingPage() {
  const categories = loadAll()
  const rows = buildEverythingRows(categories)
  const arenas = categories.map((d) => ({ id: d.category.id, name: d.category.name }))
  const processes = buildEverythingProcessRows()
  const stacks = buildEverythingStackRows(categories)
  const lenses = buildEverythingLensRows()

  const globalStories = collectGlobalStories(categories)
  const uniqueProductIds = new Set(rows.map((r) => r.productId))
  const firstArena = arenas[0]
  const firstAltProduct = rows[0]
  const firstGlobalStory = globalStories[0]

  const linkGroups: Array<{ title: string; links: Array<{ href: string; label: string; note?: string }> }> = [
    {
      title: 'Global rankings',
      links: [
        { href: '/rankings/agentic', label: 'Most agent-ready', note: 'all products' },
        { href: '/rankings/init', label: 'Highest PA Score', note: 'all products' },
        { href: '/rankings/ai-native', label: 'Most AI-native', note: 'all products' },
        { href: '/rankings/claims-integrity', label: 'Claims vs reality', note: 'all products' },
      ],
    },
    {
      title: 'Tools',
      links: [
        { href: '/compare', label: 'Compare', note: 'any products side by side' },
        { href: '/stacks/builder', label: 'Stack builder', note: 'compose your own stack' },
        { href: '/submit', label: 'Submit a product', note: 'agent-readiness quick scan' },
        { href: '/mcp', label: 'MCP server', note: 'query rankings from any agent' },
        { href: '/mcp#cli', label: 'CLI', note: 'npx productarena' },
        { href: '/llms.txt', label: '/llms.txt', note: 'for agents' },
      ],
    },
    {
      title: 'Transparency',
      links: [
        { href: '/pipeline', label: 'Testing pipeline', note: 'how scores are made' },
        { href: '/proofs', label: 'Recorded proofs', note: 'replayable probe evidence' },
        { href: '/badges', label: 'Badges', note: 'embeddable score badges' },
        { href: '/methodology', label: 'Methodology', note: 'the full scoring story' },
      ],
    },
    {
      title: 'Indexes',
      links: [
        ...(firstArena
          ? [{
              href: `/arena/${firstArena.id}/checklist`,
              label: `Buyer checklists — ${arenas.length} arenas`,
              note: `one RFP view per arena, e.g. ${firstArena.name}`,
            }]
          : []),
        ...(firstAltProduct
          ? [{
              href: `/alternatives/${firstAltProduct.productId}`,
              label: `Alternatives pages — ${uniqueProductIds.size} products`,
              note: `e.g. alternatives to ${firstAltProduct.name}`,
            }]
          : []),
        ...(firstGlobalStory
          ? [{
              href: `/global/${firstGlobalStory.id}`,
              label: `Global story pages — ${globalStories.length} cross-arena questions`,
              note: `e.g. ${firstGlobalStory.title.toLowerCase()}`,
            }]
          : []),
      ],
    },
  ]

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display leading-[1.1] text-2xl font-bold tracking-tight">Everything</h1>
        <p className="mt-1 font-mono text-xs tabular-nums text-zinc-500">
          {rows.length} products · {arenas.length} arenas · {processes.length} processes · {stacks.length} stacks ·{' '}
          {lenses.length} lenses — the whole catalog on one page.
        </p>
      </header>

      {/* 1 · Products — the full catalog */}
      <section id="products" className="space-y-2">
        <h2 className="font-display leading-[1.1] text-lg font-semibold tracking-tight">Products</h2>
        <p className="text-xs text-zinc-500">
          Every ranked product. Triplet is PA Score · agent-ready · agentic (each /100); the letter is the
          score-confidence grade; M/C/A are MCP, CLI, and API access.
        </p>
        <EverythingCatalog rows={rows} arenas={arenas} />
      </section>

      {/* 2 · Processes */}
      <section id="processes" className="space-y-2">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display leading-[1.1] text-lg font-semibold tracking-tight">
            <Link href="/processes" className="hover:text-emerald-300">Processes</Link>
          </h2>
          <span className="font-mono text-xs tabular-nums text-zinc-500">{processes.length}</span>
        </div>
        <p className="text-xs text-zinc-500">
          Founder operating processes with the % of steps an agent can run today (the agent ceiling).
        </p>
        <ul className="rounded-lg border border-zinc-800">
          {processes.map((p) => (
            <li key={p.slug} className="flex items-center gap-2 px-2 py-[7px] text-[13px] leading-none odd:bg-zinc-900/40 sm:gap-3">
              <Link href={`/processes/${p.slug}`} className="min-w-0 flex-1 truncate hover:text-emerald-300">
                {p.title}
              </Link>
              <span className="hidden w-20 shrink-0 truncate text-[10px] uppercase tracking-wider text-zinc-500 sm:block">
                {p.phase}
              </span>
              <span
                className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-300"
                title={`Agent ceiling: ${p.agentSteps} of ${p.totalSteps} steps agent-runnable today`}
              >
                {p.pct}% <span className="text-zinc-600">{p.agentSteps}/{p.totalSteps}</span>
              </span>
              <span className="hidden w-40 shrink-0 gap-1.5 truncate text-[11px] text-zinc-500 md:flex">
                {p.vendors.map((v) =>
                  v.arenaId ? (
                    <Link key={v.label} href={`/arena/${v.arenaId}`} className="truncate hover:text-emerald-300">
                      {v.label}
                    </Link>
                  ) : (
                    <span key={v.label} className="truncate">{v.label}</span>
                  ),
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · Stacks */}
      <section id="stacks" className="space-y-2">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display leading-[1.1] text-lg font-semibold tracking-tight">
            <Link href="/stacks" className="hover:text-emerald-300">Stacks</Link>
          </h2>
          <span className="font-mono text-xs tabular-nums text-zinc-500">{stacks.length}</span>
        </div>
        <p className="text-xs text-zinc-500">Curated cross-arena bundles — every scored slot resolved live from current leaderboards.</p>
        <ul className="rounded-lg border border-zinc-800">
          {stacks.map((s) => (
            <li key={s.id} className="flex items-center gap-2 px-2 py-[7px] text-[13px] leading-none odd:bg-zinc-900/40 sm:gap-3">
              <Link href={`/stacks#${s.id}`} className="w-40 shrink-0 truncate font-medium hover:text-emerald-300 sm:w-52">
                {s.name}
              </Link>
              <span className="w-14 shrink-0 font-mono text-xs tabular-nums text-zinc-500" title={`${s.slotCount} slots`}>
                {s.slotCount} slots
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-500">{s.picks.join(' · ')}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 · Lenses */}
      <section id="lenses" className="space-y-2">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display leading-[1.1] text-lg font-semibold tracking-tight">
            <Link href="/icp" className="hover:text-emerald-300">ICP lenses</Link>
          </h2>
          <span className="font-mono text-xs tabular-nums text-zinc-500">{lenses.length}</span>
        </div>
        <p className="text-xs text-zinc-500">The same canonical verdicts re-weighted for ten different buyer types.</p>
        <ul className="rounded-lg border border-zinc-800">
          {lenses.map((l) => (
            <li key={l.id} className="flex items-center gap-2 px-2 py-[7px] text-[13px] leading-none odd:bg-zinc-900/40 sm:gap-3">
              <Link href={`/icp/${l.id}`} className="w-40 shrink-0 truncate font-medium hover:text-emerald-300 sm:w-52">
                {l.name}
              </Link>
              <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-500">{l.tagline}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 5 · Everything else — dense link index */}
      <section id="more" className="space-y-2">
        <h2 className="font-display leading-[1.1] text-lg font-semibold tracking-tight">Everything else</h2>
        {/* grid-cols-1 (not the implicit default column): minmax(0,1fr) lets the truncate on the
            li actually clamp long labels; an implicit auto column would size to max-content and
            overflow the page on phones. */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border border-zinc-800 p-4 sm:grid-cols-2">
          {linkGroups.map((group) => (
            <div key={group.title} className="min-w-0">
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-500">{group.title}</h3>
              <ul className="mt-1.5 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href} className="truncate text-xs leading-5">
                    <Link href={link.href} className="text-zinc-300 hover:text-emerald-300">
                      {link.label}
                    </Link>
                    {link.note && <span className="text-zinc-600"> — {link.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
