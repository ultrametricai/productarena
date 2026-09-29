import type { Metadata } from 'next'
import CopyAuditDashboard from '@/components/CopyAuditDashboard'
import { loadCopyAudit } from '@/lib/copyAudit'

// UNLINKED founder copy-audit review list (founder ask 2026-09-29: "we have a lot of
// descriptions and text all over the place, give me a /admin where I can see all the examples
// of stuff that is superfluous"). Deliberately absent from app/sitemap.ts, the nav, the command
// palette (lib/search-index.ts PAGE_DEFS), and llms.txt — reachable only by typing the URL, the
// /ops and /queue precedent — and noindexed below.
//
// Same two-layer privacy as /ops, both honest:
//   1. This static shell prerenders ONLY data/copy-audit.json — a curated index of copy the
//      site already renders world-readable on the listed routes (nothing secret to leak; the
//      gate is about FOCUS, not secrecy).
//   2. components/CopyAuditDashboard.tsx applies the ADMIN GATE client-side, exactly like
//      components/OpsDashboard.tsx: a WorkOS session email on NEXT_PUBLIC_ADMIN_EMAILS, any
//      verified @ultrametric.ai session, or the founder's `localStorage.setItem('pa-admin',
//      '1')` switch — everyone else gets literally nothing rendered beyond an empty shell.
export const metadata: Metadata = {
  title: 'Admin — copy audit — Ultrametric',
  description: 'Internal review list: superfluous descriptions and text across the site, with cut/tighten/keep calls.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-static'

export default function AdminPage() {
  return <CopyAuditDashboard audit={loadCopyAudit()} />
}
