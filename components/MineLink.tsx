'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { loginUrl, useSession } from '@/lib/session'
import { SITE_URL } from '@/lib/site'

// Every "Check my process / run it with your stack" link (founder 2026-09-23): signed-in
// readers go straight to the personalized run; signed-out readers go through sign-up/login
// with a returnTo DEEP LINK back to that exact process's /mine page, where they set their
// vendors. One component so the behavior is identical on the page CTA, the step upgrade
// nudges, the leaderboard banner, and the lens banner.
export default function MineLink({
  mineHref,
  className,
  title,
  children,
}: {
  mineHref: string
  className?: string
  title?: string
  children: ReactNode
}) {
  const session = useSession()
  if (session.state === 'anonymous') {
    return (
      <a
        href={loginUrl(`${SITE_URL}${mineHref}`)}
        title={title ? `${title} (sign up or log in first — you'll land right back here)` : 'Sign up or log in, then set your vendors for this process'}
        className={className}
      >
        {children}
      </a>
    )
  }
  // Authenticated AND still-loading sessions link straight through — /mine gates client-side
  // anyway, so a loading-state guess never strands anyone.
  return (
    <Link href={mineHref} title={title} className={className}>
      {children}
    </Link>
  )
}
