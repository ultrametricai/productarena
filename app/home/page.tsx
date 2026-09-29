import type { Metadata } from 'next'
import Link from 'next/link'
import BackedByBuilders from '@/components/BackedByBuilders'

// The company landing homepage, ported from the retired Astro landing site into the product
// app so every page shares app/layout.tsx — one top bar sitewide (founder 2026-09-29). The
// Cloudflare worker maps ultrametric.ai/ → this route (and /overall → app/page.tsx, the
// product index), so the canonical URL for this page is the site root.
//
// Fidelity notes vs the live landing:
// - The WebGL Newton-fractal hero backdrop and the footer strange-attractor canvas are
//   replaced by the landing's own static CSS-gradient fallback (what it already showed
//   whenever WebGL was unavailable or reduced-motion was set).
// - The #products section stays gone (removed by founder ask 2026-09-29); the two product
//   cards below (AFK company processes + Foreloop) are the compact replacement.
// - The landing footer is not duplicated here: it became the sitewide standard footer in
//   app/layout.tsx (founder 2026-09-29 addendum).
export const metadata: Metadata = {
  title: 'Ultrametric — Automating the startup',
  description: 'Automate company processes with Ultrametric and product development with Foreloop.',
  alternates: { canonical: 'https://ultrametric.ai/' },
  openGraph: {
    title: 'Ultrametric — Automating the startup',
    description: 'Automate company processes with Ultrametric and product development with Foreloop.',
    type: 'website',
    url: 'https://ultrametric.ai/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ultrametric — Automating the startup',
    description: 'Automate company processes with Ultrametric and product development with Foreloop.',
  },
}

// Static page — no data dependency.
export const dynamic = 'force-static'

// The landing hero's no-WebGL fallback gradient, verbatim (its .cb-fallback rule).
const HERO_BACKDROP =
  'radial-gradient(60% 80% at 22% 30%, rgb(16 90 108 / .5), transparent 70%), radial-gradient(55% 70% at 78% 24%, rgb(112 44 128 / .4), transparent 70%), radial-gradient(70% 90% at 60% 85%, rgb(150 96 22 / .3), transparent 70%), #09090b'

export default function HomePage() {
  return (
    <div className="space-y-0">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800/60">
        <div className="pointer-events-none absolute inset-0" style={{ background: HERO_BACKDROP }} aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-zinc-950/30" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-zinc-950 to-transparent" aria-hidden />
        <div className="relative z-[1] mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-24 text-center sm:px-8 sm:py-36 md:px-12">
          <p className="mb-6 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.35em] text-zinc-300 sm:text-xs">
            Redefining work in the AI phase transition
          </p>
          <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">
            Automating
            <br />
            the startup
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            The next great companies will run themselves — operations, code, and all. We&apos;re building the
            products that let you create from anywhere.
          </p>
          <Link
            href="/virtual-startup"
            className="mt-12 inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-950/40 px-6 py-2.5 text-sm text-zinc-200 backdrop-blur-sm transition-colors hover:border-zinc-500 hover:text-white"
          >
            Open the startup simulator <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* The two products — compact cards (the old #products section itself was removed by
          founder ask; these carry its two destinations). */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-8 md:grid-cols-2 md:px-12">
          <Link
            href="/company"
            className="group rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 transition-colors hover:border-zinc-600"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Ultrametric</p>
            <h2 className="font-display mt-3 text-2xl font-bold tracking-tight">Company processes</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Run business processes with AI, from company setup to payroll, banking, and compliance —
              coordinated across your tools, with approvals where you need them.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-200 group-hover:text-white">
              Build an AI native business <span aria-hidden>→</span>
            </span>
          </Link>
          <a
            href="https://foreloop.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 transition-colors hover:border-zinc-600"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Foreloop</p>
            <h2 className="font-display mt-3 text-2xl font-bold tracking-tight">Product development</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Automate product development — the build loop that takes software from idea to shipped,
              continuously.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-200 group-hover:text-white">
              foreloop.com <span aria-hidden>↗</span>
            </span>
          </a>
        </div>
      </section>

      <BackedByBuilders />
    </div>
  )
}
