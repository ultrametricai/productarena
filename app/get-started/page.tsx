import type { Metadata } from 'next'
import InstallMethods from '@/components/InstallMethods'
import V2DeviceStage from '@/components/V2DeviceStage'

// The dedicated Ultrametric CLI/MCP product page ("the /v2 product"), ported from the live
// ultrametric.ai/v2 (old Astro landing origin, still served past our worker by a Cloudflare
// ZONE rule) into the product app so it shares the sitewide layout — one top bar, one footer
// (founder 2026-09-29, same pattern as app/home and app/company). The worker maps '/v2' and
// '/v2/' straight through to this route; the mapping goes live the moment the founder removes
// the zone rule.
//
// Fidelity notes vs the live /v2:
// - Copy is verbatim: hero, the three-method install module, the laptop/phone process demo's
//   threads and scene tabs, and the "Works across the agents you already use" cards.
// - The install module is the shared components/InstallMethods.tsx — extracted from this
//   page's inline module (which carried more polish: per-method notes, aria-live copy label)
//   and now also rendered by the sitewide InstallBanner, so the two never drift.
// - The device demo's beat-by-beat reveal script and scoped CSS are unrecoverable (the zone
//   rule covers only /v2 itself; its /_astro/* assets 404 against the Next origin), so
//   components/V2DeviceStage.tsx is a static-fallback recreation per the components/fx
//   pattern: scenes fully revealed, tabs + Approve still interactive, no timers.
// - The live page's closing "Your AI native company starts here" module is NOT duplicated
//   here: the sitewide InstallBanner (app/layout.tsx) renders that exact module directly
//   below this page — the page ends before it and the banner is that section.
// - The hero module carries no id="install": the sitewide banner owns that anchor (the
//   header's Install link), and duplicating the id would break it.
// - noindex,nofollow is PRESERVED from the live page (it ships
//   <meta name="robots" content="noindex, nofollow">) until the founder flips it.
// - The live og:image (/og-sitegen.svg) is a landing-origin asset that won't exist after the
//   cutover, so it's deliberately not referenced; og title/description/url are mirrored.
export const metadata: Metadata = {
  title: 'Ultrametric — Start and run your company from any agent',
  description:
    'Step-by-step managed processes to let your agent handle incorporating, hiring, payroll, and more. Start on your laptop, approve from your phone.',
  alternates: { canonical: 'https://ultrametric.ai/get-started' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Ultrametric — Start and run your company from any agent',
    description:
      'Step-by-step managed processes to let your agent handle incorporating, hiring, payroll, and more. Start on your laptop, approve from your phone.',
    type: 'website',
    url: 'https://ultrametric.ai/get-started',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ultrametric — Start and run your company from any agent',
    description:
      'Step-by-step managed processes to let your agent handle incorporating, hiring, payroll, and more. Start on your laptop, approve from your phone.',
  },
}

// Static page — no data dependency.
export const dynamic = 'force-static'

const AGENT_CARDS: { title: string; body: string }[] = [
  {
    title: 'Keep your setup',
    body: 'Your agent keeps its connections, plugins and context. No new app to learn.',
  },
  {
    title: 'Switch models anytime',
    body: 'Move to a new model the day it ships. Your company and work in progress come with you.',
  },
  {
    title: 'No second AI bill',
    body: 'Ultrametric runs no model. The work uses the AI plan you already pay for.',
  },
]

export default function V2Page() {
  return (
    // Full-bleed breakout of the layout's max-w-7xl main (the app/home pattern): the live
    // page's section border-t rules run edge to edge, and -my-10 lets the hero meet the
    // header and the last section meet the sitewide install banner (this page's closing
    // module).
    <div className="relative left-1/2 w-screen -translate-x-1/2 -my-10">
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="overflow-x-clip pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-8 md:px-12">
          <h1 id="hero-heading" className="font-display text-balance text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl">
            Start and run your company from any agent
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Step-by-step managed processes to let your agent handle incorporating, hiring, payroll, and more.
          </p>
          <div className="mt-10 w-full">
            <InstallMethods />
          </div>
        </div>
        {/* Laptop/phone process demo */}
        <div className="mx-auto mt-16 max-w-6xl px-4 sm:mt-20 sm:px-8 md:px-12">
          <V2DeviceStage />
        </div>
      </section>

      {/* Works across the agents you already use */}
      <section aria-labelledby="agents-heading" className="border-t border-zinc-800/60 py-24 sm:py-32">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-8 md:px-12">
          <h2 id="agents-heading" className="font-display text-balance text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Works across the agents you already use
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Most companies already use more than one AI provider. Start a process in one agent and finish it in
            another, on your laptop or your phone.
          </p>
          <ul className="mt-14 grid w-full max-w-2xl gap-4 text-left lg:max-w-none lg:grid-cols-3">
            {AGENT_CARDS.map((card) => (
              <li key={card.title} className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="font-display text-lg font-medium text-zinc-100">{card.title}</h3>
                <p className="leading-relaxed text-zinc-400">{card.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {/* The page ends here: the live /v2's closing "Your AI native company starts here"
          module is the sitewide InstallBanner, rendered by app/layout.tsx right below. */}
    </div>
  )
}
