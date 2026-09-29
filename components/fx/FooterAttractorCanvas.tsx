'use client'

// The landing footer's strange-attractor canvas, restored into the sitewide footer (founder
// 2026-09-29: "the homepage has lost its animations"). Faithful port of the original compiled
// script — recovered from the still-live ultrametric.ai/v2 page (identical copy in the
// web.archive.org 2026-08-25 homepage snapshot). It plots a Clifford attractor
// (x' = sin(a·y) − cos(b·x), y' = sin(c·x) − cos(d·y)) whose four parameters drift slowly, so
// the point cloud continuously re-forms over the footer's graph-paper grid.
//
// Behavior, as the original:
// - 12 particles, weighted palette: zinc (6) / emerald (3) / violet (1.5), alpha 0.045,
//   additive ("lighter") compositing over a rgba(9,9,11,.05) per-frame fade.
// - prefers-reduced-motion: one static 20k-iteration plot (re-drawn on resize), no animation.
// - Pauses via IntersectionObserver + visibilitychange; ResizeObserver re-seeds on resize.
// - No 2d context (jsdom, ancient browsers): bails; the footer just shows the CSS grid.

import { useEffect, useRef } from 'react'

const PALETTE: { rgb: string; weight: number }[] = [
  { rgb: '161, 161, 170', weight: 6 }, // zinc-400
  { rgb: '52, 211, 153', weight: 3 }, // emerald-400
  { rgb: '167, 139, 250', weight: 1.5 }, // violet-400
]
const FADE = 'rgba(9, 9, 11, 0.05)'
const PARTICLES = 12

export default function FooterAttractorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const host = canvas.closest('footer') ?? canvas.parentElement
    if (!(host instanceof HTMLElement)) return
    let ctx: CanvasRenderingContext2D | null = null
    try {
      ctx = canvas.getContext('2d')
    } catch {
      return
    }
    if (!ctx) return
    const c2d = ctx

    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const totalWeight = PALETTE.reduce((sum, p) => sum + p.weight, 0)
    const particles: { x: number; y: number; fill: string }[] = []
    let width = 0
    let height = 0
    let raf = 0
    let last = 0
    let inView = false
    let t = Math.random() * 500

    for (let i = 0; i < PARTICLES; i++) {
      let pick = Math.random() * totalWeight
      let rgb = PALETTE[0].rgb
      for (const entry of PALETTE) {
        pick -= entry.weight
        if (pick <= 0) {
          rgb = entry.rgb
          break
        }
      }
      particles.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, fill: `rgba(${rgb}, 0.045)` })
    }

    // Slowly drifting Clifford parameters around (-2, -2, -1.2, 2).
    const params = (time: number) => ({
      a: -2 + 0.16 * Math.sin(time * 0.023),
      b: -2 + 0.14 * Math.sin(time * 0.017 + 1.7),
      c: -1.2 + 0.12 * Math.sin(time * 0.029 + 3.1),
      d: 2 + 0.16 * Math.sin(time * 0.013 + 4.6),
    })

    const plot = (time: number, steps: number) => {
      const { a, b, c, d } = params(time)
      const scale = Math.min(height * 0.19, width * 0.1)
      const cx = width / 2
      const cy = height * 0.52
      c2d.globalCompositeOperation = 'lighter'
      for (const particle of particles) {
        c2d.fillStyle = particle.fill
        let { x, y } = particle
        for (let i = 0; i < steps; i++) {
          const nx = Math.sin(a * y) - Math.cos(b * x)
          const ny = Math.sin(c * x) - Math.cos(d * y)
          x = nx
          y = ny
          c2d.fillRect(cx + x * scale, cy + y * scale, 1, 1)
        }
        particle.x = x
        particle.y = y
      }
      c2d.globalCompositeOperation = 'source-over'
    }

    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = host.clientWidth
      height = host.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0)
      c2d.fillStyle = '#09090b'
      c2d.fillRect(0, 0, width, height)
      plot(t, 3000)
    }

    const step = (dt: number) => {
      t += dt
      c2d.fillStyle = FADE
      c2d.fillRect(0, 0, width, height)
      plot(t, Math.round(6000 / particles.length))
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1e3, 0.05)
      last = now
      if (dt > 0) step(dt)
    }
    const startLoop = () => {
      if (raf === 0) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const stopLoop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    let ro: ResizeObserver | null = null
    let io: IntersectionObserver | null = null

    if (reduced) {
      const drawStatic = () => {
        seed()
        plot(t, 20000)
      }
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(drawStatic)
        ro.observe(host)
      }
      drawStatic()
      return () => {
        ro?.disconnect()
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(seed)
      ro.observe(host)
    }
    seed()

    const updateRunning = () => {
      if (inView && !document.hidden) startLoop()
      else stopLoop()
    }
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        inView = entries.some((entry) => entry.isIntersecting)
        updateRunning()
      })
      io.observe(host)
    } else {
      // No IO (very old browsers): run whenever the tab is visible.
      inView = true
      updateRunning()
    }
    document.addEventListener('visibilitychange', updateRunning)

    return () => {
      stopLoop()
      document.removeEventListener('visibilitychange', updateRunning)
      ro?.disconnect()
      io?.disconnect()
    }
  }, [])

  // Matches the original #footer-attractor element (id dropped — the ref scopes it).
  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
}
