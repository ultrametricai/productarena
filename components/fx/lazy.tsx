'use client'

// Client-only lazy mounts for the restored landing canvases (founder 2026-09-29: "the homepage
// has lost its animations"). ssr:false keeps the canvases (and their WebGL/attractor code) out
// of the SSG HTML and the initial server render entirely — each page keeps its static CSS
// fallback in the prerendered markup, and the canvas overlays (position:absolute, behind
// content) mount on the client with zero layout shift. `ssr: false` must live in a client
// module (see node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md), hence this file.

import dynamic from 'next/dynamic'

export const HeroFractal = dynamic(() => import('./HeroFractalCanvas'), { ssr: false })
export const JuliaHero = dynamic(() => import('./JuliaHeroCanvas'), { ssr: false })
export const FooterAttractor = dynamic(() => import('./FooterAttractorCanvas'), { ssr: false })
