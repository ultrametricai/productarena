import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProcessCheck from '@/components/ProcessCheck'
import { buildProcessCheckSteps } from '@/lib/processCheckData'
import { findProcessBySlug, loadProcesses, processSlug } from '@/lib/processes'

// "Check my process" — the PERSONALIZED run of one founder process against the reader's own
// account stack (founder asks: sign up → configure your vendors → run the process with upgrade
// recommendations; and "don't change the general SEO pages; allow them to see THEIR version at
// a different URL"). The public /processes/[slug] page stays the one shared, static SEO version;
// this route prerenders the same lean step rankings for everyone and components/ProcessCheck.tsx
// personalizes it entirely client-side (session gate → /my-stack pointer → per-step scores).
// Session-gated content, so: noindex, and deliberately absent from app/sitemap.ts.

export function generateStaticParams() {
  return loadProcesses().flatMap((t) => [
    { slug: processSlug(t.title) },
    ...(t.slugAliases ?? []).map((a) => ({ slug: a.slug })),
  ])
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const task = findProcessBySlug(slug)
  return {
    title: task ? `${task.title} — with your stack — ProductArena` : 'Check my process — ProductArena',
    description: 'Run this process with your own stack: your vendor per step, scored against the market’s best, with upgrade recommendations.',
    robots: { index: false, follow: false },
  }
}

export default async function ProcessMinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const task = findProcessBySlug(slug)
  if (!task) notFound()

  const canonicalSlug = processSlug(task.title)
  const steps = buildProcessCheckSteps(task)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-400">
          <Link href="/processes" className="hover:text-emerald-300">Processes</Link>
          <span className="mx-1 text-zinc-600">/</span>
          <Link href={`/processes/${canonicalSlug}`} className="hover:text-emerald-300">{task.title}</Link>
          <span className="mx-1 text-zinc-600">/</span>
          with your stack
        </p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">
          {task.title} — with your stack
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          The same story-derived step rankings as the{' '}
          <Link href={`/processes/${canonicalSlug}`} className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            public process page
          </Link>
          , run against the vendors you told us you use: your pick&rsquo;s judged step score vs
          the step&rsquo;s best, with the steps worth upgrading flagged. Your stack stays in your
          account and this browser — this page is the same static file for everyone.
        </p>
      </div>

      {steps.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 px-4 py-6 text-sm text-zinc-500">
          None of this process&rsquo;s steps has a story-derived ranking yet, so there is nothing
          to score a stack against — see the{' '}
          <Link href={`/processes/${canonicalSlug}`} className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            public process page
          </Link>{' '}
          for the market options.
        </p>
      ) : (
        <ProcessCheck steps={steps} totalSteps={task.dag.nodes.length} />
      )}
    </div>
  )
}
