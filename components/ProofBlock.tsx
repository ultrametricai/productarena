import type { ProofIndexEntry } from '@/lib/proofs'

// Server component: renders one probe proof recording (lib/proofs.ts) — a terminal-styled
// scrollable transcript for kind:'terminal', a <video> player for kind:'video'. Purely
// presentational: the caller (components/ProofsSection.tsx) reads the transcript / resolves
// the video URL, so this stays renderable from any route.

// Recordings keep SGR color sequences on disk (lib/proofs.ts sanitizes everything else); the
// site currently renders plain text, so drop them at display time.
function stripSgr(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '')
}

function StoryChips({ storyIds, titles }: { storyIds: string[]; titles: Record<string, string> }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {storyIds.map((id) => (
        <a
          key={id}
          href={`#story-${id}`}
          title={titles[id] ?? id}
          className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 transition hover:border-emerald-400 hover:text-emerald-300"
        >
          proves: {titles[id] ?? id}
        </a>
      ))}
    </span>
  )
}

export default function ProofBlock({
  entry,
  transcript,
  videoSrc,
  storyTitles = {},
}: {
  entry: ProofIndexEntry
  /** Sanitized transcript text for kind:'terminal' (null when the file is missing). */
  transcript?: string | null
  /** Resolved (basePath-prefixed) URL of the recording for kind:'video'. */
  videoSrc?: string
  /** storyId → display title for the "proves:" chips; ids fall back to themselves. */
  storyTitles?: Record<string, string>
}) {
  const ok = entry.exitCode === 0
  const recordedOn = entry.recordedAt.slice(0, 10)

  return (
    <figure className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <code className="min-w-0 break-all font-mono text-xs text-zinc-300">
          <span className="mr-1.5 select-none text-emerald-400">$</span>
          {entry.command}
        </code>
        <span
          className={`ml-auto shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            ok ? 'border-emerald-400/60 text-emerald-300' : 'border-red-400/60 text-red-300'
          }`}
        >
          {ok ? 'reproduced' : `failed (exit ${entry.exitCode})`}
        </span>
      </figcaption>

      {entry.kind === 'video' && videoSrc ? (
        <video controls preload="metadata" className="max-h-96 w-full bg-black" src={videoSrc} />
      ) : entry.kind === 'terminal' && transcript ? (
        <pre className="max-h-72 overflow-auto px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-200">
          {stripSgr(transcript)}
        </pre>
      ) : (
        <p className="px-3 py-2.5 text-xs italic text-zinc-500">recording unavailable</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-zinc-800 px-3 py-1.5">
        <StoryChips storyIds={entry.storyIds} titles={storyTitles} />
        <span className="ml-auto shrink-0 text-[10px] text-zinc-500">recorded {recordedOn}</span>
      </div>
    </figure>
  )
}
