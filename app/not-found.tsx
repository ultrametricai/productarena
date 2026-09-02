import Link from 'next/link'

// 404: the INIT lab and its robot friend, mid-probe, finding no evidence this page exists.
// Original flat-shape scene in the site's zinc/amber system — same geometric language as the
// InitMark (three-ish shapes per character, no gradients, no cartoon detail).
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-8 py-16 text-center">
      <svg viewBox="0 0 320 180" width={360} height={202} aria-label="The INIT dog and its robot friend testing software and finding nothing" className="max-w-full">
        {/* terminal/laptop */}
        <rect x="118" y="70" width="84" height="56" rx="6" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
        <rect x="108" y="126" width="104" height="8" rx="4" fill="#27272a" />
        <text x="160" y="95" textAnchor="middle" fontFamily="monospace" fontSize="18" fill="#fbbf24" fontWeight="bold">
          404
        </text>
        <text x="160" y="112" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#71717a">
          verdict: none q0
        </text>

        {/* the lab — head from the InitMark geometry, simple seated body, facing the screen */}
        <g transform="translate(30,44) scale(2.6)">
          <path
            d="M5,29 Q3,20 5,12 Q5,6 10,4 Q16,3.5 19,8 Q18,10 22,10.5 Q26,10.2 28,13.5 Q29,16 27,18.5 Q24,20.5 19,20 Q15,19.5 13,23 Q11.5,26 14,28.5 Q15,29.5 9,29.3 Q6,29.5 5,29 Z"
            fill="#fbbf24"
          />
          <path d="M10.5,5.5 Q6.5,7 6,13 Q5.5,18 8.5,21 Q10.5,18 10.5,12 Q11,8.5 10.5,5.5 Z" fill="#d97706" />
          <circle cx="17" cy="10" r="2" fill="#09090b" />
          {/* front paw resting toward the keyboard */}
          <rect x="24" y="27" width="10" height="4" rx="2" fill="#fbbf24" />
        </g>

        {/* tail — mid-wag despite the result */}
        <path d="M34 116 Q18 104 24 88" stroke="#fbbf24" strokeWidth="7" strokeLinecap="round" fill="none" />

        {/* robot friend — rounded head, antenna, amber eye, holding a checklist */}
        <g transform="translate(224,58)">
          <line x1="26" y1="2" x2="26" y2="12" stroke="#3f3f46" strokeWidth="3" />
          <circle cx="26" cy="2" r="3.5" fill="#fbbf24" />
          <rect x="6" y="12" width="40" height="34" rx="9" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
          <circle cx="19" cy="28" r="4.5" fill="#fbbf24" />
          <circle cx="34" cy="28" r="4.5" fill="#fbbf24" />
          <rect x="14" y="46" width="24" height="30" rx="7" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
          {/* arm to the checklist */}
          <rect x="-14" y="52" width="30" height="5" rx="2.5" fill="#3f3f46" />
          {/* checklist card */}
          <g transform="translate(-34,38)">
            <rect width="26" height="34" rx="4" fill="#fafafa" />
            <line x1="5" y1="9" x2="21" y2="9" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="5" y1="17" x2="21" y2="17" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M5 25 l4 4 l8 -8" stroke="#d97706" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </svg>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">No evidence this page exists</h1>
        <p className="mx-auto max-w-md text-sm text-zinc-400">
          We crawled, probed, and judged — this URL scored{' '}
          <span className="font-mono text-zinc-300">none q0</span> across all evidence tiers. The
          dog remains optimistic.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-lg border border-amber-400/60 px-4 py-2 font-medium text-amber-300 transition hover:bg-amber-400/10"
        >
          Back to the arenas
        </Link>
        <Link
          href="/rankings/init"
          className="rounded-lg border border-zinc-800 px-4 py-2 text-zinc-300 transition hover:border-amber-400/60 hover:text-amber-300"
        >
          Global INIT ranking
        </Link>
      </div>
    </div>
  )
}
