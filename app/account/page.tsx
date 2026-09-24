import type { Metadata } from 'next'
import Link from 'next/link'
import AccountHeader from '@/components/AccountHeader'
import GeoMark from '@/components/GeoMark'

// The user area (founder 2026-09-22: "a user area where they can set their vendors — if they
// set 'I'm using this' it will be recorded and have an area in their settings"; 2026-09-23:
// split into separate pages behind a standard left sidebar — see app/account/layout.tsx).
// This page is the profile/session half: who you're signed in as, and log out. Your vendors
// moved to /account/vendors; the watchlist stays at /watchlist. Static shell — all personal
// state is client-gated (lib/session.ts); the server never sees who you are.
export const metadata: Metadata = {
  title: 'Account — ProductArena',
  description: 'Your account: your session, sign-out, and links to your vendors and watchlist.',
  // Session-gated content: noindex, and deliberately absent from app/sitemap.ts.
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-display leading-[1.1] mt-1 flex items-center gap-2.5 text-3xl font-bold tracking-tight">
          <GeoMark seed="account" title="Your ProductArena account" size={22} className="text-zinc-500" />
          Account
        </h1>
        {/* Client-gated identity row: email + log out when signed in, sign-up prompt when not. */}
        <AccountHeader />
      </section>

      <section className="border-t border-zinc-800 pt-4 text-sm text-zinc-400">
        <p>
          Your saved state lives in the other sections:{' '}
          <Link href="/account/vendors" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            My vendors
          </Link>{' '}
          (the software you run, powering your{' '}
          <Link href="/processes" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            process pages
          </Link>{' '}
          and{' '}
          <Link href="/my-stack" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            stack advice
          </Link>
          ) and your{' '}
          <Link href="/watchlist" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            Watchlist
          </Link>{' '}
          (products you starred). Signed in, both sync to your account; signed out, they stay on
          this device.
        </p>
      </section>
    </div>
  )
}
