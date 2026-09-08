import type { Metadata } from 'next'
import Link from 'next/link'
import SimpleMarkdown from '@/components/SimpleMarkdown'
import { loadPublishedNotes } from '@/lib/notes'
import { REPO } from '@/lib/site'

// Arena Notes — the editorial lane. Drafts are generated weekly by
// pipeline/scripts/generate-arena-notes.ts into drafts/arena-notes/, but this page renders ONLY
// files whose frontmatter says `status: published` (see lib/notes.ts). Nothing is ever
// auto-published: a human reads the draft, signs off by editing the frontmatter, and commits.
// Static by construction, tolerant-optional like /reports: no published notes renders an honest
// explainer, never an error.

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Arena Notes — ProductArena',
  description:
    'Arena Notes — a short weekly point-of-view essay on what moved in the arenas and why, drafted from the committed score history and published only after human sign-off.',
}

export default function NotesPage() {
  const notes = loadPublishedNotes()
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Arena Notes</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Notes from the arena floor</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          A short weekly essay — the flip that mattered, the gap nobody&apos;s filling, the vendor move to
          watch, and one honest critique of our own data. Every claim cites the site data it came from.
          Unlike the{' '}
          <Link href="/reports" className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 hover:text-emerald-200">
            weekly reports
          </Link>{' '}
          (generated, deterministic), notes are editorial: the pipeline drafts them, a human signs off
          before anything appears here. Drafts live{' '}
          <a
            href={`https://github.com/${REPO}/tree/main/drafts/arena-notes`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 hover:text-emerald-200"
          >
            in the repo
          </a>{' '}
          with <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">status: draft</code> until then.
        </p>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 p-5 text-sm text-zinc-400">
          <p>
            No notes published yet. A note only appears here after a human reviews the generated draft
            and flips its frontmatter to <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">status: published</code> —
            drafts never auto-publish.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {notes.map((note) => (
            <article key={note.date} id={note.date} className="scroll-mt-4 rounded-xl border border-zinc-800 p-5">
              <h2 className="font-display leading-[1.1] text-xl font-bold tracking-tight">{note.title}</h2>
              <p className="mt-1 text-xs text-zinc-500">{note.date}</p>
              <div className="mt-3">
                <SimpleMarkdown markdown={note.body} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
