'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'
import posthog from 'posthog-js'

// PostHog product analytics (founder 2026-09-23 — company account). Activates ONLY when
// NEXT_PUBLIC_POSTHOG_KEY is set at build time (a phc_ project key is publishable/client-side
// by design); without it this renders nothing and loads nothing. The site is fully static, so
// pageviews are captured manually on every App Router navigation (posthog-js's automatic
// capture only sees hard loads).
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialized = useRef(false)

  useEffect(() => {
    if (!KEY) return
    if (!initialized.current) {
      initialized.current = true
      posthog.init(KEY, {
        api_host: HOST,
        // Manual pageviews (SPA navigations); pageleave keeps bounce/duration usable.
        capture_pageview: false,
        capture_pageleave: true,
        // Analytics only — no session recording without an explicit founder decision.
        disable_session_recording: true,
        persistence: 'localStorage+cookie',
      })
    }
    posthog.capture('$pageview')
  }, [pathname, searchParams])

  return null
}

export default function PostHogInit() {
  if (!KEY) return null
  return (
    // useSearchParams requires a Suspense boundary in the App Router; fallback renders nothing.
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  )
}
