'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// Mobile hamburger (founder 2026-09-24: "the mobile top bar goes off the page — we need a
// hamburger menu"). Below sm the header shows only logo · ☰ · search · account; every other
// destination lives here. Desktop never renders this (sm:hidden) — the full button row and the
// Arenas/Explore dropdowns stay the desktop IA.
const ITEMS: Array<{ href: string; label: string; icon: string }> = [
  { href: '/arenas', label: 'Arenas', icon: '🏟' },
  { href: '/processes', label: 'Processes', icon: '🔁' },
  { href: '/technologies', label: 'Technologies', icon: '🔌' },
  { href: '/virtual-startup', label: 'Virtual Startup', icon: '🧪' },
  { href: '/stacks', label: 'Stacks', icon: '🧱' },
  { href: '/compare', label: 'Compare', icon: '⚖' },
  { href: '/global', label: 'Global rankings', icon: '🌍' },
  { href: '/methodology', label: 'Methodology', icon: '📐' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside tap / Escape — same lightweight pattern as the header dropdowns.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 transition hover:border-emerald-400/60"
      >
        <span aria-hidden className="text-base leading-none">☰</span>
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl shadow-black/50">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-emerald-300"
            >
              <span aria-hidden className="w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
