import Link from 'next/link'
import CeilingBar from '@/components/CeilingBar'
import { IconGlyph } from '@/components/IconChip'
import ProductLogoView from '@/components/ProductLogoView'
import type { ProcessRow } from '@/components/ProcessesTable'

// Homepage "Automating founder processes" section (founder 2026-09-30): a compact, static mini
// table of ~20 processes from the same server-side rows /processes renders (lib/processRows.ts),
// in FOUNDER-TIMELINE order (timeOrder — the sequence a founder actually hits them, the
// "Founder timeline" preset on the full table). Columns: icon, title, area, vendors,
// agent-ceiling bar. Server component, zero client JS — the sortable/filterable table lives on
// /processes. Icons go through IconGlyph (the process link carries the name), never raw —
// r.icon is a `pi:` token since the custom icon set landed.
export const HOME_PROCESSES_COUNT = 20

export default function HomeProcessesMini({ rows }: { rows: ProcessRow[] }) {
  return (
    <section aria-labelledby="home-processes-heading" className="border-t border-zinc-800/60 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 md:px-12">
        <h2 id="home-processes-heading" className="font-display text-balance text-3xl font-medium tracking-tight sm:text-4xl">
          Automating founder processes
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Founder processes mapped step-by-step — every step routed to an agent, a form, or a human,
          with the share an agent can run today. In the order a founder hits them:
        </p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
                <th scope="col" className="px-3 py-2 font-normal">Process</th>
                <th scope="col" className="hidden px-3 py-2 font-normal sm:table-cell">Area</th>
                <th scope="col" className="hidden px-3 py-2 font-normal lg:table-cell">
                  <span title="The main vendors this process runs on — judged vendors link to their product page">Vendor</span>
                </th>
                <th scope="col" className="px-3 py-2 font-normal">Agent ceiling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {rows.map((r) => (
                <tr key={r.slug} className="transition hover:bg-zinc-800/70">
                  <td className="min-w-[220px] px-2 py-2">
                    <Link href={`/processes/${r.slug}`} className="flex min-w-0 items-center gap-2 hover:text-emerald-300">
                      <span aria-hidden className="shrink-0">
                        <IconGlyph icon={r.icon} />
                      </span>
                      <span className="min-w-0 truncate font-medium">{r.title}</span>
                    </Link>
                  </td>
                  <td className="hidden whitespace-nowrap px-2 py-2 text-xs text-zinc-500 sm:table-cell">{r.area}</td>
                  <td className="hidden px-2 py-2 lg:table-cell">
                    <span className="flex flex-wrap gap-1">
                      {r.vendors.slice(0, 3).map((v) =>
                        v.arena ? (
                          // Same contract as the full /processes table: a vendor chip opens the
                          // PROCESS through that vendor (?via= lens), not the vendor's own page.
                          <Link key={v.label} href={`/processes/${r.slug}?via=${v.arena}:${v.id}`} title={`Open ${r.title} viewed via ${v.label} — every step resolved to it where it serves`} className="inline-flex items-center gap-1 rounded-full border border-zinc-700 py-px pl-0.5 pr-1.5 text-[10px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300">
                            <ProductLogoView product={{ id: v.id, name: v.label }} size={14} hasLogo={v.hasLogo} />
                            {v.label}
                          </Link>
                        ) : (
                          <span key={v.label} title={`${v.label} — not yet judged on Ultrametric`} className="inline-flex items-center gap-1 rounded-full border border-zinc-800 py-px pl-0.5 pr-1.5 text-[10px] text-zinc-500">
                            <ProductLogoView product={{ id: v.id, name: v.label }} size={14} hasLogo={v.hasLogo} />
                            {v.label}
                          </span>
                        ),
                      )}
                      {r.vendors.length > 3 && (
                        <Link
                          href={`/processes/${r.slug}`}
                          className="text-[10px] text-zinc-500 transition hover:text-emerald-300"
                          title={`${r.vendors.slice(3).map((v) => v.label).join(', ')} — see the full per-step rankings`}
                        >
                          +{r.vendors.length - 3}
                        </Link>
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <CeilingBar pct={r.pct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm">
          <Link href="/processes" className="text-emerald-400 underline decoration-emerald-400/40 transition hover:text-emerald-300">
            See processes →
          </Link>
        </p>
      </div>
    </section>
  )
}
