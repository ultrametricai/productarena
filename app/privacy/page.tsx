import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy — ProductArena',
  description:
    'What ProductArena collects and why: Google Analytics, an anonymous compare-pair counter, a local-only watchlist, and — if you log in — your email. Nothing is sold.',
}

// Static page, same pattern as app/terms/page.tsx. Plain-language, PA-specific privacy notes on
// top of the Ultrametric base policy (ultrametric.ai/privacy). Facts here mirror the actual
// implementation: GA4 in app/layout.tsx, the KV compare-pair counter and WorkOS auth in
// infra/cloudflare-proxy/worker.js, and the localStorage watchlist in components/WatchButton.tsx.
export const dynamic = 'force-static'

const SECTION = 'rounded-xl border border-zinc-800 p-4'
const H2 = 'text-sm font-semibold uppercase tracking-widest text-emerald-400'
const EXT_LINK = 'underline decoration-zinc-700 hover:text-emerald-300'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Privacy</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          ProductArena is a static site: every reader gets the same pages, no account needed. The short
          version — we collect very little, and we sell none of it. Details below; the{' '}
          <a
            href="https://ultrametric.ai/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={EXT_LINK}
          >
            Ultrametric Privacy Policy
          </a>{' '}
          is the base policy and covers anything not listed here.
        </p>
      </div>

      <section className={SECTION}>
        <h2 className={H2}>Analytics</h2>
        <p className="mt-2 text-sm text-zinc-300">
          We use Google Analytics 4 to understand which pages get read — standard usage data such as pages
          visited, referrer, browser, and approximate location derived from IP. Google&apos;s processing is
          described in{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={EXT_LINK}
          >
            Google&apos;s privacy policy
          </a>
          . You can block it with standard browser tooling; the site works fully without it.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>Compare counter</h2>
        <p className="mt-2 text-sm text-zinc-300">
          When you open a comparison, we increment a counter for that product pair so popular comparisons can
          be surfaced. The counter stores product-pair names and a number — no IP addresses, no user agents,
          no timestamps per visit, no per-visitor state of any kind.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>Watchlist</h2>
        <p className="mt-2 text-sm text-zinc-300">
          The ☆ watchlist is stored in your own browser (localStorage). It never leaves your device and we
          cannot see it.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>If you log in</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Logging in is optional and only adds features; the whole site works logged out. Login uses WorkOS
          AuthKit. If you log in, we set a signed, HTTP-only session cookie containing your user id and email
          address — the email is the only personal information we hold, used to show you your session and
          contact you about your account if ever needed. We do not sell it, share it with vendors we rank, or
          use it for advertising. To delete it, email{' '}
          <a href="mailto:legal@ultrametric.ai" className={EXT_LINK}>
            legal@ultrametric.ai
          </a>
          .
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>Cookies</h2>
        <p className="mt-2 text-sm text-zinc-300">
          The only cookie ProductArena itself sets is the session cookie above, and only after you log in.
          Google Analytics sets its own cookies as described in its policy.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>No sale of data</h2>
        <p className="mt-2 text-sm text-zinc-300">
          We do not sell personal information, and we do not share it for cross-context behavioral
          advertising. Flags and contributions happen in public on GitHub under GitHub&apos;s own terms and
          privacy policy — anything you post there is public by design.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>Questions and requests</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Access, correction, and deletion requests — and anything this page doesn&apos;t answer — go to{' '}
          <a href="mailto:legal@ultrametric.ai" className={EXT_LINK}>
            legal@ultrametric.ai
          </a>
          . Site usage terms are on the{' '}
          <Link href="/terms" className={EXT_LINK}>
            terms
          </Link>{' '}
          page.
        </p>
      </section>
    </div>
  )
}
