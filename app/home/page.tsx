import type { Metadata } from 'next'
import Link from 'next/link'
import BackedByBuilders from '@/components/BackedByBuilders'
import { GetStartedAgentsSection, GetStartedHeroSection } from '@/components/GetStartedSections'
import HomeProcessesMini, { HOME_PROCESSES_COUNT } from '@/components/HomeProcessesMini'
import HomeRankingsMini, { HOME_RANKINGS_COUNT } from '@/components/HomeRankingsMini'
import { HeroFractal } from '@/components/fx/lazy'
import { loadAll } from '@/lib/data'
import { buildMegaTableRows } from '@/lib/megaTable'
import { DEFAULT_COLUMN, DEFAULT_DIRECTION, sortMegaRows } from '@/lib/megaTableSort'
import { buildProcessRows } from '@/lib/processRows'

// The company landing homepage, ported from the retired Astro landing site into the product
// app so every page shares app/layout.tsx — one top bar sitewide (founder 2026-09-29). The
// Cloudflare worker maps ultrametric.ai/ → this route (and /overall → app/page.tsx, the
// product index), so the canonical URL for this page is the site root.
//
// Full-fidelity recreation (founder addendum 2026-09-29: "the home page core needs to return
// to what it was") — markup follows the web.archive.org 2026-08-25 snapshot of ultrametric.ai
// verbatim, restored animations included:
// - Hero: full-bleed, viewport-height, with the WebGL Newton-fractal backdrop
//   (components/fx/HeroFractalCanvas.tsx — original shader recovered) over the static
//   .cb-fallback gradient (which stays as the no-WebGL / pre-hydration state), and the
//   static h1 (the char-melt dissolve was retired by founder ask, 2026-09-29).
// - Products: the original large AFK/Foreloop cards (eyebrow, display-black title, mono
//   subtitle, hover hairline + glow, circle-arrow CTA row).
// - The two deliberate differences from the retired page (both founder-ordered 2026-09-29):
//   the #products anchor/id is gone and the hero CTA is "Open the startup simulator →" →
//   /startup-sim (was "See the products ↓" → #products); and the AFK card's destination
//   is /company (the ported product page — the old /afk 301s there), Foreloop's is
//   foreloop.com (the old /foreloop landing page wasn't ported).
// - The landing footer is not duplicated here: it became the sitewide standard footer in
//   app/layout.tsx (founder 2026-09-29 addendum), attractor canvas included.
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

// Static page — the mini tables read the committed data/ + processes/ corpora at build time
// (same loaders as /overall and /processes), never at request time.
export const dynamic = 'force-static'

// The landing hero's no-WebGL fallback gradient, verbatim (its .cb-fallback rule).
const HERO_BACKDROP =
  'radial-gradient(60% 80% at 22% 30%, rgb(16 90 108 / .5), transparent 70%), radial-gradient(55% 70% at 78% 24%, rgb(112 44 128 / .4), transparent 70%), radial-gradient(70% 90% at 60% 85%, rgb(150 96 22 / .3), transparent 70%), #09090b'

// The unused ProductCard component (the original #products markup) was deleted 2026-09-30 —
// the products section it rendered was removed twice by founder ask (2026-09-29) and the new
// homepage flow below replaces it for good.

export default function HomePage() {
  // The Rankings mini table (founder 2026-09-30): the TOP 15 of the /overall default companies
  // view — same row builder, same default order (agent-ready desc, lib/megaTableSort.ts), family
  // sub-products and secondary-arena duplicates excluded exactly as MegaTable's default view
  // hides them — so rank i+1 here IS the rank on /overall.
  const topRankings = sortMegaRows(
    buildMegaTableRows(loadAll()).filter((r) => !r.isFamilySubProduct && !r.isSecondaryArena),
    DEFAULT_COLUMN,
    DEFAULT_DIRECTION,
  ).slice(0, HOME_RANKINGS_COUNT)
  // The processes mini table: ~20 rows from the same server-side rows /processes renders, in
  // founder-timeline order (the "Founder timeline" preset's ordering).
  const topProcesses = [...buildProcessRows().rows]
    .sort((a, b) => a.timeOrder - b.timeOrder || a.title.localeCompare(b.title))
    .slice(0, HOME_PROCESSES_COUNT)
  return (
    // Full-bleed breakout of the layout's max-w-7xl px-5 py-10 main: the landing ran its hero
    // and section rules edge-to-edge. -my-10 cancels main's vertical padding so the hero meets
    // the header and the last section meets the install banner. html is overflow-x: clip (see
    // globals.css) so w-screen can't introduce a scrollbar-width horizontal overflow.
    <div className="relative left-1/2 w-screen -translate-x-1/2 -my-10">
      {/* Hero — ~70% viewport height (founder 2026-09-30, down from 100svh) minus the
          (non-fixed, unlike the landing's) product header; content stays vertically centered. */}
      <section className="relative flex min-h-[calc(70svh-4rem)] flex-col overflow-hidden">
        {/* Decorative WebGL backdrop — the original Newton-fractal flow, lazily mounted
            client-only. The .cb-fallback gradient is the SSG/no-WebGL/reduced-motion state. */}
        <div className="complex-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="cb-fallback absolute inset-0" style={{ background: HERO_BACKDROP }} />
          <HeroFractal />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-zinc-950/30" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-zinc-950 to-transparent" aria-hidden />
        <div className="relative z-[1] mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-24 pt-24 text-center sm:px-8 md:px-12">
          {/* The "Redefining work in the AI phase transition" eyebrow was removed
              (founder 2026-09-30). */}
          {/* Static h1 (founder 2026-09-29: no per-char shifting) — DissolveHeading retired here. */}
          <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">
            Automating
            <br />
            the startup
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            The next great companies will run themselves — operations, code, and all. We&apos;re building the
            products that let you focus on creating and skip the automatable.
          </p>
          <Link
            href="/startup-sim"
            className="mt-12 inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-950/40 px-6 py-2.5 text-sm text-zinc-200 backdrop-blur-sm transition-colors hover:border-zinc-500 hover:text-white"
          >
            Play with the open startup <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Products — the original large cards (no #products id, per founder ask 2026-09-29). */}
      {/* Products section removed (founder 2026-09-29, second ask — the fidelity
          restoration had brought it back). */}

      {/* Homepage flow after the hero (founder 2026-09-30): Backed by builders → Rankings
          (top 15 of /overall) → Automating founder processes (~20 timeline-ordered rows) →
          the /get-started content sections (shared components — one module, two pages) —
          ending where the sitewide InstallBanner ("Your AI native company starts here",
          app/layout.tsx) takes over, then the footer. */}
      <BackedByBuilders />
      {/* Processes above the vendor rankings (founder 2026-09-30 reorder). */}
      <HomeProcessesMini rows={topProcesses} />
      <HomeRankingsMini rows={topRankings} />
      {/* The get-started hero renders as an h2 section here — the landing hero above owns h1. */}
      <div className="border-t border-zinc-800/60">
        <GetStartedHeroSection headingLevel="h2" />
      </div>
      <GetStartedAgentsSection />
    </div>
  )
}
