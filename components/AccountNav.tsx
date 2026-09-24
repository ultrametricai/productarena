'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Standard left sidebar for the account area (founder 2026-09-23: split /account into separate
// pages "with a standard left sidebar"). Pure navigation — identical for every reader, so the
// static HTML stays the same for anonymous visitors (the client personalization contract).
// Active state comes from usePathname, baked per-route at prerender time. Watchlist lives at
// its existing /watchlist route (same session-gated posture) — the sidebar just links to it.

const SECTIONS = [
  { href: '/account', label: 'Account', icon: '⚙' },
  { href: '/account/vendors', label: 'My vendors', icon: '▦' },
  { href: '/watchlist', label: 'Watchlist', icon: '☆' },
] as const

export default function AccountNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Account sections" className="md:w-44 md:shrink-0">
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5">
        {SECTIONS.map((s) => {
          const active = pathname === s.href
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? 'bg-zinc-800/80 font-medium text-emerald-300'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-emerald-300'
                }`}
              >
                <span aria-hidden className={active ? 'text-emerald-400' : 'text-zinc-600'}>
                  {s.icon}
                </span>
                {s.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
