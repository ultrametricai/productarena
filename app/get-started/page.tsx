import type { Metadata } from 'next'
import { GetStartedAgentsSection, GetStartedHeroSection } from '@/components/GetStartedSections'

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

export default function V2Page() {
  return (
    // Full-bleed breakout of the layout's max-w-7xl main (the app/home pattern): the live
    // page's section border-t rules run edge to edge, and -my-10 lets the hero meet the
    // header and the last section meet the sitewide install banner (this page's closing
    // module).
    <div className="relative left-1/2 w-screen -translate-x-1/2 -my-10">
      {/* Hero copy + install module + device demo, then the agents cards — both shared with the
          homepage's closing flow (components/GetStartedSections.tsx, founder 2026-09-30); the
          hero heading is this page's h1. */}
      <GetStartedHeroSection />
      <GetStartedAgentsSection />
      {/* The page ends here: the live /v2's closing "Your AI native company starts here"
          module is the sitewide InstallBanner, rendered by app/layout.tsx right below. */}
    </div>
  )
}
