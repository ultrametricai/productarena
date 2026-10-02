import Link from 'next/link'
import FatProcessSearch from '@/components/FatProcessSearch'
import { IconGlyph } from '@/components/IconChip'
import { MOBILE_NAV_ICONS } from '@/lib/arenaIcons'
import ProcessesTable, { type ProcessTableRow, type PlaybookRow } from '@/components/ProcessesTable'
import { PROCESSES_INDEX_DEFAULT_GEO } from '@/lib/geoPreference'

export default function ProcessIndex({ tableRows, phases, playbooks, preview = false }: {
  tableRows: ProcessTableRow[]; phases: string[]; playbooks: PlaybookRow[]; preview?: boolean
}) {
  return (
    <div className="space-y-12">
      {/* Founder 2026-09-25: retitled + the intro paragraph replaced by a fat search bar —
          the routing/honesty story lives on /methodology and in the per-step tooltips. */}
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">
          Going agentic with company processes
        </h1>
        {/* The fat search matches the end-to-end chains too (founder 2026-09-29) — chain rows
            carry the chain-page href, the aggregate ceiling, and the invisible 'playbook'
            pseudo-phase so typing the word still finds them (the visible copy never says it —
            founder same-day: "we don't need to say 'playbook'… playbooks are still processes"). */}
        <FatProcessSearch
          rows={[
            ...tableRows.map((r) => ({ href: r.href ?? `/processes/${r.slug}`, title: r.title, icon: r.icon, phase: r.phase, pct: r.pct })),
            ...playbooks.map((p) => ({ href: p.href, title: p.title, icon: p.icon, phase: 'playbook', pct: p.pct, playbook: true })),
          ]}
        />
        {/* The geo dimension (founder GEO ask 2026-09-28, lib/geoPreference.ts): every process
            row below always wears its geoScope glyph; since 2026-09-30 the index opens on the
            GLOBAL framing by default (see the ProcessesTable defaultGeo prop below). */}
      </section>

      {/* ONE view under the search (founder 2026-09-29: "combine playbooks and all processes
          into one table"; same-day follow-up: "we don't need to say 'playbook'… playbooks are
          still processes") — every row grouped by area, the end-to-end chains folded into their
          dominant area; the old separate playbooks section AND the 'Playbooks' vocabulary are
          gone from this UI. */}
      <section className="space-y-3">
        {/* No 'All processes' heading (founder 2026-09-30) — the table stands alone under the
            search. The route-dot legend went earlier (founder 2026-09-29). */}
        {/* The index DEFAULTS onto the global view (founder 2026-09-30: "default /processes
            onto a global view — you can include the US specific ones in the first view"): the
            geo dropdown opens on 🌐 Global and the always-on scope glyphs run sharp (🌐/🇺🇸/🏛)
            — server-rendered via this prop, not a mount flash, with every US-specific row still
            in the first view (the geo dimension annotates, never filters). ?geo=/pa-geo win as
            before; process DETAIL pages keep their US default (the seam is documented on
            lib/geoPreference.ts PROCESSES_INDEX_DEFAULT_GEO). */}
        <ProcessesTable rows={tableRows} phases={phases} playbooks={playbooks} defaultGeo={PROCESSES_INDEX_DEFAULT_GEO} />
        {/* Virtual Startup (founder ask 2026-09-23) — the playbooks composed into one seeded,
            decision-driven journey with clearly-labeled synthetic artifacts. */}
        <Link
          href="/startup-sim"
          className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-2xl border border-zinc-800 p-4 transition hover:border-emerald-400/50 hover:bg-emerald-400/5"
        >
          {/* The sim's house flask glyph (lib/arenaIcons.ts MOBILE_NAV_ICONS['/startup-sim']) —
              was the 🐣 emoji; the label text names the concept. */}
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-200">
            <span aria-hidden className="inline-flex"><IconGlyph icon={MOBILE_NAV_ICONS['/startup-sim']} /></span>
            The open startup simulator
          </span>
          <span className="text-sm text-zinc-400">
            pick the starting decisions — entity, team, funding, business model — and watch a
            simulated company run these real processes day by day
          </span>
          <span className="text-sm text-emerald-400">→</span>
        </Link>
      </section>

      <section className="mx-auto max-w-3xl text-center text-sm text-zinc-500">
        <p>
          {/* Stale-copy fix (SSOT audit 2026-09-30): the simulator left process pages on
              2026-09-30 (chain pages keep it) — the footer now claims only what the process
              page actually does. */}
          {preview ? <>Preview records use the existing index assessments where available; blank cells have no matching assessment.</> : <>Every mapped vendor traces to a live arena leaderboard — pick a vendor on the process
          page and every step re-resolves to the calls actually recorded for it.</>}{' '}
          <Link href="/" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            See all rankings →
          </Link>
        </p>
      </section>
    </div>
  )
}
