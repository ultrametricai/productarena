'use client'

import { useEffect, useRef } from 'react'

// Site-wide instant tooltips. Native `title` attributes carry a browser-controlled ~1s hover
// delay (founder feedback: "tooltips are slow to show up") that cannot be configured, so this
// global delegate upgrades every existing `title=` in place: on hover it stashes the title into
// `data-tip` (suppressing the native tooltip), renders a styled tooltip near-instantly, and
// restores the attribute on leave — so the DOM keeps `title` for a11y/agents/tests except during
// the brief hover window. Mounted once in app/layout.tsx; zero per-callsite changes, and new
// tooltips added anywhere pick this up automatically.
//
// Touch devices never see these (founder 2026-09-24): a tap means activate, not hover.
const SHOW_DELAY_MS = 80 // near-instant but ignores drive-by cursor passes

export default function InstantTooltip() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tip = ref.current
    if (!tip) return
    let current: HTMLElement | null = null
    let showTimer: ReturnType<typeof setTimeout> | undefined
    let touchTimer: ReturnType<typeof setTimeout> | undefined

    function place(target: HTMLElement) {
      const r = target.getBoundingClientRect()
      tip!.style.maxWidth = '340px'
      // Render first (hidden) to measure, then clamp into the viewport.
      tip!.style.visibility = 'hidden'
      tip!.style.display = 'block'
      const tw = tip!.offsetWidth
      const th = tip!.offsetHeight
      let x = r.left + r.width / 2 - tw / 2
      x = Math.max(8, Math.min(x, window.innerWidth - tw - 8))
      let y = r.bottom + 8
      if (y + th > window.innerHeight - 8) y = r.top - th - 8
      tip!.style.left = `${Math.round(x)}px`
      tip!.style.top = `${Math.round(y)}px`
      tip!.style.visibility = 'visible'
    }

    function show(target: HTMLElement) {
      const text = target.getAttribute('title')
      if (!text || !text.trim()) return
      // Suppress the native tooltip while ours is up; keep the text recoverable.
      target.setAttribute('data-tip', text)
      target.removeAttribute('title')
      current = target
      tip!.textContent = text
      place(target)
    }

    function hide() {
      if (current) {
        const stashed = current.getAttribute('data-tip')
        if (stashed !== null && !current.hasAttribute('title')) current.setAttribute('title', stashed)
        current.removeAttribute('data-tip')
        current = null
      }
      tip!.style.display = 'none'
      clearTimeout(showTimer)
    }

    function onOver(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest?.('[title]') as HTMLElement | null
      if (!target || target === current) return
      hide()
      clearTimeout(showTimer)
      showTimer = setTimeout(() => show(target), SHOW_DELAY_MS)
    }

    function onOut(e: MouseEvent) {
      const related = e.relatedTarget as Node | null
      if (current && related && current.contains(related)) return
      hide()
    }

    // Founder 2026-09-24: NO tooltips on touch taps — on mobile a tap means "activate", and a
    // tooltip popping over the tap target was noise. Touch devices simply never see these
    // (the underlying title text stays in the DOM for a11y/agents). A touchstart flag also
    // guards against the synthetic mouseover some mobile browsers fire after a tap.
    let touching = false
    function onTouchStart() {
      touching = true
      hide()
      clearTimeout(touchTimer)
      touchTimer = setTimeout(() => {
        touching = false
      }, 700)
    }

    function onOverGuarded(e: MouseEvent) {
      if (touching) return
      onOver(e)
    }

    document.addEventListener('mouseover', onOverGuarded, true)
    document.addEventListener('mouseout', onOut, true)
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    document.addEventListener('scroll', hide, true)
    return () => {
      document.removeEventListener('mouseover', onOverGuarded, true)
      document.removeEventListener('mouseout', onOut, true)
      document.removeEventListener('touchstart', onTouchStart, true)
      document.removeEventListener('scroll', hide, true)
      hide()
    }
  }, [])

  return (
    <div
      ref={ref}
      role="tooltip"
      style={{ display: 'none', position: 'fixed', zIndex: 90 }}
      className="pointer-events-none whitespace-pre-line rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs leading-snug text-zinc-200 shadow-xl shadow-black/40"
    />
  )
}
