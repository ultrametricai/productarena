import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Ultrametric',
  description:
    'Ultrametric, Inc. builds the open startup repo: agent-runnable founder processes, evidence-graded tool rankings, and the open startup simulator — everything evidence-driven, affiliations disclosed.',
}

// Static page, deliberately minimal (founder 2026-09-30: "just make it simple — 1 paragraph
// that is short, and Jude and Tyler on the bottom as circle images of our profiles").
export const dynamic = 'force-static'

// Committed copies of the founders' GitHub avatars (public/people/) — no hotlinking.
const FOUNDERS = [
  { name: 'Jude Gomila', src: '/people/jude.png', github: 'https://github.com/judegomila' },
  { name: 'Tyler Lastovich', src: '/people/tyler.jpg', github: 'https://github.com/tylerlastovich' },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">About</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">About Ultrametric</h1>
        <p className="mt-4 text-zinc-400">
          Ultrametric is the open startup repo — a source-backed map of the processes it takes to
          start and run a company, the honest share an agent can run today, and evidence-graded
          rankings of the tools that serve each step. Everything on this site is generated from
          dated, citable records committed to a public repository, never from opinion — and where
          our own products appear, the affiliation is disclosed and audited.
        </p>
      </div>

      <div className="flex items-center gap-8">
        {FOUNDERS.map((f) => (
          <a
            key={f.name}
            href={f.github}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- committed static asset */}
            <img
              src={f.src}
              alt={f.name}
              width={96}
              height={96}
              className="size-24 rounded-full border border-zinc-800 object-cover transition group-hover:border-emerald-400/60"
            />
            <span className="text-sm text-zinc-400 transition group-hover:text-emerald-300">{f.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
