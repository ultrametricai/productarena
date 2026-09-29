import type { Metadata } from 'next'
import Link from 'next/link'
import BackedByBuilders from '@/components/BackedByBuilders'
import DissolveHeading from '@/components/fx/DissolveHeading'
import { HeroFractal } from '@/components/fx/lazy'

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
//   char-melt "dissolve" on the h1 (components/fx/DissolveHeading.tsx).
// - Products: the original large AFK/Foreloop cards (eyebrow, display-black title, mono
//   subtitle, hover hairline + glow, circle-arrow CTA row).
// - The two deliberate differences from the retired page (both founder-ordered 2026-09-29):
//   the #products anchor/id is gone and the hero CTA is "Open the startup simulator →" →
//   /virtual-startup (was "See the products ↓" → #products); and the AFK card's destination
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

// Static page — no data dependency.
export const dynamic = 'force-static'

// The landing hero's no-WebGL fallback gradient, verbatim (its .cb-fallback rule).
const HERO_BACKDROP =
  'radial-gradient(60% 80% at 22% 30%, rgb(16 90 108 / .5), transparent 70%), radial-gradient(55% 70% at 78% 24%, rgb(112 44 128 / .4), transparent 70%), radial-gradient(70% 90% at 60% 85%, rgb(150 96 22 / .3), transparent 70%), #09090b'

// One large landing product card (the original #products markup, verbatim classes).
function ProductCard({
  href,
  external,
  accent,
  eyebrow,
  title,
  subtitle,
  lead,
  body,
  cta,
}: {
  href: string
  external?: boolean
  accent: 'emerald' | 'sky'
  eyebrow: string
  title: string
  subtitle: string
  lead: string
  body: string
  cta: string
}) {
  const hoverBorder = accent === 'emerald' ? 'hover:border-emerald-500/50' : 'hover:border-sky-500/50'
  const hairline = accent === 'emerald' ? 'via-emerald-400/70' : 'via-sky-400/70'
  const glow = accent === 'emerald' ? 'bg-emerald-500/10' : 'bg-sky-500/10'
  const eyebrowColor = accent === 'emerald' ? 'text-emerald-400' : 'text-sky-400'
  const className = `group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/70 to-zinc-950/30 p-8 transition-all duration-300 sm:p-10 hover:-translate-y-0.5 ${hoverBorder}`
  const inner = (
    <>
      <span
        aria-hidden
        className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-50 transition-opacity duration-300 group-hover:opacity-100 ${hairline}`}
      />
      <span
        aria-hidden
        className={`absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${glow}`}
      />
      <p className={`font-mono text-[0.6875rem] font-medium uppercase tracking-[0.25em] ${eyebrowColor}`}>{eyebrow}</p>
      <h2 className="font-display mt-6 text-5xl font-black tracking-tight sm:text-6xl">{title}</h2>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">{subtitle}</p>
      <p className="mt-8 text-lg font-medium leading-snug text-zinc-100">{lead}</p>
      <p className="mb-10 mt-3 text-sm leading-relaxed text-zinc-400">{body}</p>
      <span className="mt-auto flex items-center justify-between border-t border-zinc-800/80 pt-6 text-sm font-medium text-zinc-200 transition-colors group-hover:border-zinc-700 group-hover:text-white">
        {cta}
        <span
          aria-hidden
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-base transition-all duration-300 group-hover:border-transparent group-hover:bg-white group-hover:text-zinc-950"
        >
          →
        </span>
      </span>
    </>
  )
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {inner}
    </Link>
  )
}

export default function HomePage() {
  return (
    // Full-bleed breakout of the layout's max-w-7xl px-5 py-10 main: the landing ran its hero
    // and section rules edge-to-edge. -my-10 cancels main's vertical padding so the hero meets
    // the header and the last section meets the install banner. html is overflow-x: clip (see
    // globals.css) so w-screen can't introduce a scrollbar-width horizontal overflow.
    <div className="relative left-1/2 w-screen -translate-x-1/2 -my-10">
      {/* Hero — viewport height minus the (non-fixed, unlike the landing's) product header. */}
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden">
        {/* Decorative WebGL backdrop — the original Newton-fractal flow, lazily mounted
            client-only. The .cb-fallback gradient is the SSG/no-WebGL/reduced-motion state. */}
        <div className="complex-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="cb-fallback absolute inset-0" style={{ background: HERO_BACKDROP }} />
          <HeroFractal />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-zinc-950/30" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-zinc-950 to-transparent" aria-hidden />
        <div className="relative z-[1] mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-24 pt-24 text-center sm:px-8 md:px-12">
          <p className="mb-6 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.35em] text-zinc-300 sm:text-xs">
            Redefining work in the AI phase transition
          </p>
          <DissolveHeading className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">
            Automating
            <br />
            the startup
          </DissolveHeading>
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

      {/* Products — the original large cards (no #products id, per founder ask 2026-09-29). */}
      {/* Products section removed (founder 2026-09-29, second ask — the fidelity
          restoration had brought it back): homepage = hero + backed-by-builders. */}

      <BackedByBuilders />
    </div>
  )
}
