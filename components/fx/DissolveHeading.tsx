'use client'

// The landing hero heading's "dissolve" effect, restored (founder 2026-09-29: "the homepage
// has lost its animations"). Faithful port of the original compiled script — recovered from the
// web.archive.org 2026-08-25 snapshot of ultrametric.ai (the [data-dissolve] inline module).
// On mount it splits the heading's text nodes into .hchar spans (aria-label preserves the
// original text for assistive tech); every 3.2s one random character "melts" — a brief shake,
// then a colored blur-and-drip and reform (see .hchar / @keyframes hchar-melt in
// app/globals.css, recovered from the landing's inline <style>).
//
// prefers-reduced-motion: the heading is left untouched (no split, no animation) — exactly the
// original's behavior. The SSR/SSG markup is the plain heading text either way; the span split
// is a client-only enhancement with zero layout effect (spans are inline-block, white-space:pre).

import { useEffect, useRef, type ReactNode } from 'react'

const MELT_EVERY_MS = 3200
const MELT_CLASS = 'hchar-melt'
// [--melt-a, --melt-b] color pairs (original compiled constants: emerald, sky, purple, amber,
// rose, cyan — each with its lighter companion).
const MELT_COLORS: [string, string][] = [
  ['#34d399', '#a7f3d0'],
  ['#38bdf8', '#bae6fd'],
  ['#c084fc', '#e9d5ff'],
  ['#fbbf24', '#fde68a'],
  ['#fb7185', '#fecdd3'],
  ['#22d3ee', '#a5f3fc'],
]

// Split every text node under `root` into per-character .hchar spans; returns the animatable
// (non-whitespace) spans and the flattened label text.
function splitChars(root: HTMLElement): { chars: HTMLSpanElement[]; label: string } {
  const chars: HTMLSpanElement[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let node = walker.nextNode()
  while (node) {
    if (node instanceof Text && node.data.trim() !== '') textNodes.push(node)
    node = walker.nextNode()
  }
  const label = textNodes
    .map((n) => n.data.replaceAll(/\s+/gu, ' ').trim())
    .filter(Boolean)
    .join(' ')
  for (const textNode of textNodes) {
    const fragment = document.createDocumentFragment()
    for (const ch of textNode.data) {
      const span = document.createElement('span')
      span.className = 'hchar'
      span.textContent = ch
      fragment.append(span)
      if (ch.trim() !== '') chars.push(span)
    }
    textNode.replaceWith(fragment)
  }
  return { chars, label }
}

export default function DissolveHeading({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const { chars, label } = splitChars(root)
    root.setAttribute('aria-label', label)
    if (chars.length === 0) return
    let melting = false
    const interval = window.setInterval(() => {
      if (melting || document.visibilityState !== 'visible') return
      const char = chars[Math.floor(Math.random() * chars.length)]
      if (!char) return
      melting = true
      const pair = MELT_COLORS[Math.floor(Math.random() * MELT_COLORS.length)] ?? MELT_COLORS[0]
      if (pair) {
        char.style.setProperty('--melt-a', pair[0] ?? '#34d399')
        char.style.setProperty('--melt-b', pair[1] ?? '#a7f3d0')
      }
      char.classList.add(MELT_CLASS)
      char.addEventListener(
        'animationend',
        (e) => {
          if (e.animationName === 'hchar-melt') {
            char.classList.remove(MELT_CLASS)
            melting = false
          }
        },
        { once: true },
      )
      // Safety valve (as the original): reset even if animationend never fires.
      window.setTimeout(() => {
        char.classList.remove(MELT_CLASS)
        melting = false
      }, 2600)
    }, MELT_EVERY_MS)
    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return (
    <h1 ref={ref} className={className} data-dissolve>
      {children}
    </h1>
  )
}
