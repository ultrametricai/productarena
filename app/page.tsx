import type { Metadata } from 'next'
import Link from 'next/link'
import AiEraBadge from '@/components/AiEraBadge'
import HomeModes from '@/components/HomeModes'
import IconChip from '@/components/IconChip'
import MegaTable from '@/components/MegaTable'
import ProcessesTable from '@/components/ProcessesTable'
import ProductLogo from '@/components/ProductLogo'
import arenaIcons from '@/data/arena-icons.json'
import { battleSlug, leadingBattle, loadAll } from '@/lib/data'
import { buildMegaTableArenaOptions, buildMegaTableRows } from '@/lib/megaTable'
import { buildProcessRows } from '@/lib/processRows'

export const metadata: Metadata = {
  title: 'ProductArena — which software is most AI-friendly?',
  description:
    "One sortable table across every arena: every product judged on AGENT-READY (can an agent reach and operate it?), BUILT-IN AI (does it act agentically for its users?), API quality, and popularity. No opinion, every score traces back to cited evidence.",
}

export default function Home() {
  const categories = loadAll()
  const megaRows = buildMegaTableRows(categories)
  const arenaOptions = buildMegaTableArenaOptions(categories)
  const processes = buildProcessRows()

  // Founder 2026-09-21: "add processes onto the homepage as well, maybe have two modes,
  // company mode/process mode." Both modes ship in the static HTML; companies stays the
  // default visible mode ("the homepage IS the table", founder call 2026-09-14) and the
  // toggle persists per device (components/HomeModes.tsx).
  const companiesMode = (
    <div className="space-y-12">
      <section>
        {/* /everything is unlisted by founder call — no banner into it (route stays alive). */}
        <MegaTable rows={megaRows} arenas={arenaOptions} />
      </section>

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Arenas</h2>
        <p className="mt-1 text-sm text-zinc-500">Pick an arena to see the full head-to-head leaderboard.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((data) => {
            const { leaderboard } = data.rankings
            const leaderEntry = leaderboard[0]
            const leader = data.products.find((p) => p.id === leaderEntry.productId)!
            return (
              <Link
                key={data.category.id}
                href={`/arena/${data.category.id}`}
                className="group rounded-xl border border-zinc-800 p-4 transition hover:border-emerald-400/60"
              >
                <div className="flex -space-x-3">
                  {data.products.slice(0, 5).map((p) => (
                    <div key={p.id} className="rounded-lg ring-2 ring-zinc-950">
                      <ProductLogo product={p} size={28} />
                    </div>
                  ))}
                </div>
                <h3 className="font-display leading-[1.1] mt-3 flex items-center gap-1.5 text-base font-semibold group-hover:text-emerald-300">
                  <IconChip
                    icon={(arenaIcons as Record<string, string>)[data.category.id] ?? ''}
                    title={`${data.category.name} arena`}
                  />
                  {data.category.name}
                </h3>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400">PA Score leader</p>
                    <p className="truncate text-sm font-medium">{leader.name}</p>
                  </div>
                  <AiEraBadge value={leaderEntry.aiEra} size="sm" />
                </div>
              </Link>
            )
          })}
          {/* Founder 2026-09-15: the grid ends with a quiet "+" card — anyone can suggest the
              arena we're missing via a prefilled GitHub issue. */}
          <a
            href="https://github.com/ultrametricai/productarena/issues/new?title=%5Barena%5D%20Suggest%20a%20new%20arena%3A%20%3Cname%3E&labels=arena-suggestion&body=%23%23%20Arena%20name%0A%0A%23%23%20Products%20that%20compete%20in%20it%20(4%2B)%0A%0A-%20%0A-%20%0A-%20%0A-%20%0A%0A%23%23%20Why%20it%20matters%20in%20the%20AI%20era%0A"
            target="_blank"
            rel="noopener noreferrer"
            title="Suggest a new arena — opens a prefilled GitHub issue"
            className="group flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 p-4 text-zinc-500 transition hover:border-emerald-400/60 hover:text-emerald-300"
          >
            <span aria-hidden className="text-3xl font-light leading-none">+</span>
            <span className="text-sm font-medium">Suggest an arena</span>
          </a>
        </div>
      </section>

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Leading battles</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Every arena&rsquo;s #1 vs #2, evidence-tested round by round — see every battle on its own{' '}
          <code className="text-xs text-zinc-400">/vs/</code> page.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((data) => {
            const battle = leadingBattle(data)
            if (!battle) return null
            const a = data.products.find((p) => p.id === battle.a)!
            const b = data.products.find((p) => p.id === battle.b)!
            const winnerName = battle.winner === 'draw' ? null : battle.winner === a.id ? a.name : b.name
            return (
              <Link
                key={data.category.id}
                href={`/vs/${battleSlug(battle.a, battle.b)}`}
                className="group rounded-xl border border-zinc-800 p-4 transition hover:border-emerald-400/60"
              >
                <p className="text-xs uppercase tracking-widest text-zinc-400">{data.category.name}</p>
                {/* No PA Score badges here — those already render in the table and arena cards
                    above; this card's own datum is the head-to-head record. */}
                <div className="mt-2 flex items-center gap-2">
                  <ProductLogo product={a} size={28} />
                  <span className="text-sm font-medium group-hover:text-emerald-300">{a.name}</span>
                </div>
                <p className="my-1 text-center text-[10px] uppercase tracking-widest text-zinc-500">vs</p>
                <div className="flex items-center gap-2">
                  <ProductLogo product={b} size={28} />
                  <span className="text-sm font-medium group-hover:text-emerald-300">{b.name}</span>
                </div>
                <p className="mt-3 text-center text-xs text-emerald-300">
                  {winnerName ? `${winnerName} wins` : 'Draw'} · {battle.record.aWins}–{battle.record.bWins}
                  {battle.record.draws > 0 ? ` (${battle.record.draws} drawn)` : ''}
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )

  const processesMode = (
    <div className="space-y-8">
      <section>
        <h2 className="font-display mb-1 text-2xl font-bold leading-tight tracking-tight">
          Startup processes, run by agents
        </h2>
        <p className="max-w-2xl text-sm text-zinc-400">
          {processes.totalProcesses} founder processes mapped step-by-step — an agent can run{' '}
          <span className="font-mono text-emerald-300">{processes.agentStepPct}%</span> of the steps
          today. Every step routed (agent / manual form / human), every vendor ranked from
          judged evidence. Sort by automatability, timeline, regularity, annoyance, risk, or growth.
        </p>
      </section>
      <ProcessesTable rows={processes.rows} phases={processes.phases} />
      <p className="text-sm">
        <Link
          href="/processes"
          className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300"
        >
          All processes, end-to-end playbooks &amp; the operating rhythm →
        </Link>
      </p>
    </div>
  )

  return (
    <div>
      {/* The homepage IS the table — one visible title above the mode tabs (founder call
          2026-09-14; founder 2026-09-23: retitled "Open rankings for the AI era" and moved
          above Companies|Products|Processes), no further hero copy; the page title/description
          carry the positioning for search/social, and /methodology carries the full story. */}
      <h1 className="font-display mb-3 text-2xl font-bold leading-tight tracking-tight">
        Open rankings for the AI era
      </h1>
      <HomeModes companies={companiesMode} processes={processesMode} />
    </div>
  )
}
