'use client'

import Link from 'next/link'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { ADMIN_FLAG_KEY, isAdminEmail } from '@/components/DoViaAfk'
import { isCompanyEmail } from '@/components/OpsDashboard'
import { useSession } from '@/lib/session'
import type { CopyAudit, CopyAuditCandidate, CopyAuditKind, CopyAuditSuggestion } from '@/lib/copyAudit'

// The /admin copy-audit review body — ADMIN-GATED exactly like components/OpsDashboard.tsx
// (the /ops precedent): a WorkOS session email on NEXT_PUBLIC_ADMIN_EMAILS, ANY verified
// @ultrametric.ai session, or the founder's `localStorage.setItem('pa-admin', '1')` switch,
// read client-side with a `false` server snapshot. Non-staff get literally NOTHING rendered.
//
// The gate is about FOCUS, not secrecy: every excerpt here is copy the site already renders
// world-readable on the listed route — the audit only assembles it into a to-do list.
// Review-only surface: no edit capability, the founder reads it and fires asks from it.

function readAdminFlag(): boolean {
  try {
    return window.localStorage.getItem(ADMIN_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

function subscribeAdminFlag(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

const getServerAdminFlag = () => false

const SUGGESTION_META: Record<CopyAuditSuggestion, { title: string; blurb: string; accent: string }> = {
  cut: {
    title: 'Cut',
    blurb: 'Superfluous — remove outright.',
    accent: 'text-red-300 border-red-900/60',
  },
  tighten: {
    title: 'Tighten',
    blurb: 'Earns its place but not its length.',
    accent: 'text-amber-300 border-amber-900/60',
  },
  keep: {
    title: 'Keep — with reason',
    blurb: 'Honesty or legal floor: listed so nobody "cleans" it up by accident.',
    accent: 'text-emerald-300 border-emerald-900/60',
  },
}

const SUGGESTION_ORDER: CopyAuditSuggestion[] = ['cut', 'tighten', 'keep']

// Route patterns like /arena/[category] aren't directly linkable; link the nearest LIVE static
// prefix (a couple of dynamic families have no index page of their own — map those to the
// directory page that lists their instances, so the link never 404s).
const DYNAMIC_PREFIX_FALLBACK: Record<string, string> = {
  '/arena': '/arenas',
  '/family': '/arenas',
  '/vs': '/compare',
  '/alternatives': '/rankings/init',
}

function linkableRoute(route: string): string {
  const dynamicAt = route.indexOf('[')
  if (dynamicAt === -1) return route
  let prefix = route.slice(0, dynamicAt).replace(/\/+$/, '')
  if (prefix === '') prefix = '/'
  return DYNAMIC_PREFIX_FALLBACK[prefix] ?? prefix
}

function KindChip({ kind }: { kind: CopyAuditKind }) {
  return (
    <span className="inline-flex rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 ring-1 ring-zinc-700">
      {kind}
    </span>
  )
}

function CandidateRow({ c }: { c: CopyAuditCandidate }) {
  return (
    <li className="space-y-1 rounded-xl border border-zinc-800 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Link href={linkableRoute(c.route)} className="font-mono text-emerald-300 hover:text-emerald-200">
          {c.route}
        </Link>
        <KindChip kind={c.kind} />
        <span className="font-mono text-zinc-500">
          {c.file}:{c.line}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-200">&ldquo;{c.excerpt}&rdquo;</p>
      <p className="text-xs text-zinc-400">{c.why}</p>
    </li>
  )
}

export default function CopyAuditDashboard({ audit }: { audit: CopyAudit }) {
  // Hooks run unconditionally (rules of hooks); the admin gate comes after.
  const session = useSession()
  const localFlag = useSyncExternalStore(subscribeAdminFlag, readAdminFlag, getServerAdminFlag)
  const [kindFilter, setKindFilter] = useState<'' | CopyAuditKind>('')
  const [routePrefix, setRoutePrefix] = useState('')

  const kinds = useMemo(() => {
    const seen = new Set<CopyAuditKind>()
    for (const c of audit.candidates) seen.add(c.kind)
    return [...seen].sort()
  }, [audit.candidates])

  const emailAdmin =
    session.state === 'authenticated' &&
    (isAdminEmail(session.email, process.env.NEXT_PUBLIC_ADMIN_EMAILS) || isCompanyEmail(session.email))
  if (!emailAdmin && !localFlag) return null

  const prefix = routePrefix.trim()
  const shown = audit.candidates.filter(
    (c) => (!kindFilter || c.kind === kindFilter) && (!prefix || c.route.startsWith(prefix)),
  )
  const counts = {
    cut: audit.candidates.filter((c) => c.suggestion === 'cut').length,
    tighten: audit.candidates.filter((c) => c.suggestion === 'tighten').length,
    keep: audit.candidates.filter((c) => c.suggestion === 'keep').length,
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Founder review — unlinked, admin-gated</p>
        <h1 className="font-display mt-1 text-3xl font-bold leading-[1.1] tracking-tight">Copy audit</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {audit.candidates.length} candidates · {counts.cut} cut / {counts.tighten} tighten / {counts.keep} keep
          <span className="text-zinc-600"> · audited {audit.auditedAt} · review list only, edits happen at the source</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2 text-zinc-400">
          Kind
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as '' | CopyAuditKind)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200"
          >
            <option value="">all ({audit.candidates.length})</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-zinc-400">
          Route prefix
          <input
            type="text"
            value={routePrefix}
            onChange={(e) => setRoutePrefix(e.target.value)}
            placeholder="/processes"
            className="w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-200 placeholder:text-zinc-600"
          />
        </label>
        <span className="text-xs text-zinc-600">{shown.length} shown</span>
      </div>

      {SUGGESTION_ORDER.map((suggestion) => {
        const meta = SUGGESTION_META[suggestion]
        const items = shown.filter((c) => c.suggestion === suggestion)
        return (
          <section key={suggestion} className="space-y-4">
            <div className={`border-l-2 pl-3 ${meta.accent}`}>
              <h2 className="font-display text-xl font-bold tracking-tight">
                {meta.title} <span className="text-sm font-normal text-zinc-500">({items.length})</span>
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">{meta.blurb}</p>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-zinc-600">Nothing in this group matches the filters.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((c) => (
                  <CandidateRow key={c.id} c={c} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
