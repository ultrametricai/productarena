'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  buildCapTable,
  reportToCsv,
  reportToMarkdown,
  type CapTableEvent,
  type Snapshot,
} from '@/lib/openstartup/capTable'
import { decodeCapTableState, encodeCapTableState } from '@/lib/openstartup/capTableCodec'

// /tools/cap-table's client half: build a cap table event-by-event (found → SAFEs →
// priced round) and watch the dilution waterfall live. All math is
// lib/openstartup/capTable.ts (pure, cited, tested); this component only edits the event
// list and renders the report. State lives in `?ct=` (lib/openstartup/capTableCodec.ts) —
// read via Suspense-wrapped useSearchParams, written back via history.replaceState — the
// same static-export-safe pattern as components/StackBuilder.tsx. Zero server state.

const DEFAULT_EVENTS: CapTableEvent[] = [
  {
    kind: 'found',
    founders: [
      { name: 'Founder 1', shares: 4_250_000 },
      { name: 'Founder 2', shares: 4_250_000 },
    ],
    poolShares: 1_500_000,
  },
  { kind: 'safe', name: 'Angel SAFE', amount: 500_000, cap: 6_000_000 },
  { kind: 'priced', name: 'Series Seed', preMoney: 15_000_000, newMoney: 5_000_000, poolTargetPct: 10 },
]

const DEFAULT_TOKEN = encodeCapTableState(DEFAULT_EVENTS)

const nf = new Intl.NumberFormat('en-US')

function fmtShares(n: number | null): string {
  return n === null ? '—' : nf.format(n)
}

function fmtPct(pct: number | null): string {
  return pct === null ? 'TBD' : `${pct.toFixed(2)}%`
}

function fmtMoney(n: number): string {
  return `$${nf.format(n)}`
}

// Shared input styles (house style from MyStackBuilder)
const FIELD =
  'w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none'
const BTN =
  'rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300'

function NumField({
  label,
  value,
  onChange,
  min = 0,
  step,
  optional,
}: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  min?: number
  step?: number
  optional?: boolean
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] uppercase tracking-widest text-zinc-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        value={value ?? ''}
        placeholder={optional ? '—' : undefined}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') {
            onChange(optional ? undefined : 0)
            return
          }
          const v = Number(raw)
          if (Number.isFinite(v) && v >= 0) onChange(v)
        }}
        className={`${FIELD} mt-1 font-mono`}
      />
    </label>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] uppercase tracking-widest text-zinc-400">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value.slice(0, 80))} className={`${FIELD} mt-1`} />
    </label>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-zinc-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-emerald-400" />
      {label}
    </label>
  )
}

const EVENT_TITLES: Record<CapTableEvent['kind'], string> = {
  found: 'Founding',
  pool: 'Option pool top-up',
  grant: 'Option grant',
  safe: 'SAFE',
  priced: 'Priced round',
}

function EventEditor({
  event,
  onChange,
  onRemove,
  removable,
}: {
  event: CapTableEvent
  onChange: (ev: CapTableEvent) => void
  onRemove: () => void
  removable: boolean
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest text-emerald-300">{EVENT_TITLES[event.kind]}</span>
        {removable && (
          <button type="button" onClick={onRemove} className={BTN} aria-label={`Remove ${EVENT_TITLES[event.kind]}`}>
            Remove
          </button>
        )}
      </div>

      {event.kind === 'found' && (
        <div className="space-y-3">
          {event.founders.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <TextField
                label={`Founder ${i + 1}`}
                value={f.name}
                onChange={(name) =>
                  onChange({ ...event, founders: event.founders.map((x, j) => (j === i ? { ...x, name } : x)) })
                }
              />
              <NumField
                label="Shares"
                value={f.shares}
                onChange={(shares) =>
                  onChange({ ...event, founders: event.founders.map((x, j) => (j === i ? { ...x, shares: shares ?? 0 } : x)) })
                }
              />
              <button
                type="button"
                className={`${BTN} mb-0.5 disabled:opacity-40`}
                disabled={event.founders.length <= 1}
                onClick={() => onChange({ ...event, founders: event.founders.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="grid grid-cols-2 items-end gap-2">
            <NumField
              label="Initial option pool (shares)"
              value={event.poolShares}
              onChange={(poolShares) => onChange({ ...event, poolShares })}
              optional
            />
            <button
              type="button"
              className={BTN}
              onClick={() =>
                onChange({ ...event, founders: [...event.founders, { name: `Founder ${event.founders.length + 1}`, shares: 1_000_000 }] })
              }
            >
              + Add founder
            </button>
          </div>
        </div>
      )}

      {event.kind === 'pool' && (
        <div className="grid grid-cols-2 gap-2">
          <NumField
            label="Target % of post-increase FD"
            value={event.targetPct}
            onChange={(targetPct) => onChange({ kind: 'pool', targetPct, shares: targetPct === undefined ? event.shares : undefined })}
            optional
            step={0.5}
          />
          <NumField
            label="…or exact shares"
            value={event.shares}
            onChange={(shares) => onChange({ kind: 'pool', shares, targetPct: shares === undefined ? event.targetPct : undefined })}
            optional
          />
        </div>
      )}

      {event.kind === 'grant' && (
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Grantee" value={event.name} onChange={(name) => onChange({ ...event, name })} />
          <NumField label="Shares (from pool)" value={event.shares} onChange={(shares) => onChange({ ...event, shares: shares ?? 0 })} />
        </div>
      )}

      {event.kind === 'safe' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <TextField label="Investor" value={event.name} onChange={(name) => onChange({ ...event, name })} />
            <NumField label="Amount ($)" value={event.amount} onChange={(amount) => onChange({ ...event, amount: amount ?? 0 })} />
            <NumField label="Post-money cap ($)" value={event.cap} onChange={(cap) => onChange({ ...event, cap })} optional />
            <NumField
              label="Discount %"
              value={event.discountPct}
              onChange={(discountPct) => onChange({ ...event, discountPct })}
              optional
              step={1}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <Check label="MFN (no cap/discount; adopts later, better terms)" checked={!!event.mfn} onChange={(mfn) => onChange({ ...event, mfn: mfn || undefined })} />
            <Check label="Pro rata side letter" checked={!!event.proRata} onChange={(proRata) => onChange({ ...event, proRata: proRata || undefined })} />
          </div>
        </div>
      )}

      {event.kind === 'priced' && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TextField label="Round name" value={event.name} onChange={(name) => onChange({ ...event, name })} />
          <NumField label="Pre-money ($)" value={event.preMoney} onChange={(preMoney) => onChange({ ...event, preMoney: preMoney ?? 0 })} />
          <NumField label="New money ($)" value={event.newMoney} onChange={(newMoney) => onChange({ ...event, newMoney: newMoney ?? 0 })} />
          <NumField
            label="Pool target % post-close"
            value={event.poolTargetPct}
            onChange={(poolTargetPct) => onChange({ ...event, poolTargetPct })}
            optional
            step={0.5}
          />
        </div>
      )}
    </div>
  )
}

function SnapshotTable({ snap, highlight }: { snap: Snapshot; highlight: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-emerald-400/40' : 'border-zinc-800'}`}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">{snap.label}</h3>
        <span className="font-mono text-xs text-zinc-500">{nf.format(snap.fullyDilutedShares)} FD shares</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400">
            <th className="py-1 font-medium">Holder</th>
            <th className="py-1 text-right font-medium">Shares</th>
            <th className="py-1 text-right font-medium">Ownership</th>
          </tr>
        </thead>
        <tbody>
          {snap.rows.map((r) => (
            <tr key={r.id} className="border-t border-zinc-800/60">
              <td className="py-1 pr-2 text-zinc-300">{r.name}</td>
              <td className="py-1 text-right font-mono text-zinc-400">{fmtShares(r.shares)}</td>
              <td className="py-1 text-right font-mono text-zinc-100">{fmtPct(r.pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {snap.round && (
        <div className="mt-3 space-y-1 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
          <p>
            PPS <span className="font-mono text-emerald-300">${snap.round.pps}</span> · pre {fmtMoney(snap.round.preMoney)} + new{' '}
            {fmtMoney(snap.round.newMoney)} · pool increase{' '}
            <span className="font-mono">{nf.format(snap.round.poolIncreaseShares)}</span> · new shares{' '}
            <span className="font-mono">{nf.format(snap.round.roundShares)}</span>
          </p>
          {snap.round.conversions.map((c) => (
            <p key={c.safeName}>
              {c.safeName}: <span className="font-mono">{nf.format(c.shares)}</span> shares at{' '}
              <span className="font-mono">${c.effectivePrice}</span> — converted at{' '}
              <span className="text-emerald-300">
                {c.method === 'cap' ? `the $${nf.format(c.appliedCap ?? 0)} cap` : c.method === 'discount' ? `a ${c.appliedDiscountPct}% discount` : 'the round price'}
              </span>
              {c.mfnAdoptedFrom ? ` (MFN, terms of ${c.mfnAdoptedFrom})` : ''}
              {c.proRataShares !== undefined
                ? ` · pro rata +${nf.format(c.proRataShares)} shares (${fmtMoney(Math.round(c.proRataCost ?? 0))})`
                : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CapTableTool() {
  const searchParams = useSearchParams()
  // Lazy initializer, not a mount effect: useSearchParams already carries the real query
  // on the first client render (the page's <Suspense> boundary makes this subtree
  // client-rendered). A malformed ?ct= falls back to the default scenario.
  const [events, setEvents] = useState<CapTableEvent[]>(() => decodeCapTableState(searchParams.get('ct')) ?? DEFAULT_EVENTS)
  const [copied, setCopied] = useState<string | null>(null)

  // Mirror state into the URL (replaceState — no nav, no history spam). The default
  // scenario keeps a clean URL.
  useEffect(() => {
    const token = encodeCapTableState(events)
    const qs = token === DEFAULT_TOKEN ? '' : `?ct=${token}`
    window.history.replaceState(null, '', `${window.location.pathname}${qs}${window.location.hash}`)
  }, [events])

  const report = useMemo(() => buildCapTable(events), [events])
  const csv = useMemo(() => reportToCsv(report), [report])
  const markdown = useMemo(() => reportToMarkdown(report), [report])

  async function copy(kind: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* clipboard unavailable — the previews below show the exact text */
    }
  }

  function addEvent(ev: CapTableEvent) {
    setEvents((prev) => [...prev, ev])
  }

  const safeCount = events.filter((e) => e.kind === 'safe').length
  const roundCount = events.filter((e) => e.kind === 'priced').length

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3" aria-label="Cap table events">
        {events.map((ev, i) => (
          <EventEditor
            key={i}
            event={ev}
            removable={ev.kind !== 'found'}
            onChange={(next) => setEvents((prev) => prev.map((x, j) => (j === i ? next : x)))}
            onRemove={() => setEvents((prev) => prev.filter((_, j) => j !== i))}
          />
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BTN} onClick={() => addEvent({ kind: 'safe', name: `SAFE ${safeCount + 1}`, amount: 250_000, cap: 5_000_000 })}>
            + SAFE
          </button>
          <button type="button" className={BTN} onClick={() => addEvent({ kind: 'pool', targetPct: 10 })}>
            + Pool top-up
          </button>
          <button type="button" className={BTN} onClick={() => addEvent({ kind: 'grant', name: 'Early team', shares: 100_000 })}>
            + Option grant
          </button>
          <button
            type="button"
            className={BTN}
            onClick={() => addEvent({ kind: 'priced', name: `Series ${'ABCDE'[roundCount] ?? roundCount + 1}`, preMoney: 20_000_000, newMoney: 5_000_000, poolTargetPct: 10 })}
          >
            + Priced round
          </button>
          <button type="button" className={BTN} onClick={() => setEvents(DEFAULT_EVENTS)}>
            Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button type="button" className={BTN} onClick={() => copy('link', window.location.href)}>
            {copied === 'link' ? 'Copied ✓' : 'Copy share link'}
          </button>
          <button type="button" className={BTN} onClick={() => copy('csv', csv)}>
            {copied === 'csv' ? 'Copied ✓' : 'Copy CSV'}
          </button>
          <button type="button" className={BTN} onClick={() => copy('md', markdown)}>
            {copied === 'md' ? 'Copied ✓' : 'Copy markdown'}
          </button>
        </div>
        {/* House rule: anything that can be copied shows its code (see components/CopyPreview.tsx). */}
        <details className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400">
          <summary className="cursor-pointer">Preview: CSV (final table)</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre text-[11px] leading-relaxed text-zinc-300">{csv}</pre>
        </details>
        <details className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400">
          <summary className="cursor-pointer">Preview: markdown (full waterfall)</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre text-[11px] leading-relaxed text-zinc-300">{markdown}</pre>
        </details>
      </section>

      <section className="space-y-3" aria-label="Dilution waterfall">
        {report.error && (
          <p role="alert" className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">
            Event {report.error.eventIndex + 1} ({EVENT_TITLES[events[report.error.eventIndex]?.kind ?? 'found']}):{' '}
            {report.error.message}
          </p>
        )}
        {report.snapshots.map((snap, i) => (
          <SnapshotTable key={i} snap={snap} highlight={i === report.snapshots.length - 1 && !report.error} />
        ))}
        {report.snapshots.length === 0 && <p className="text-sm text-zinc-500">Add a founding event to start.</p>}
      </section>
    </div>
  )
}
