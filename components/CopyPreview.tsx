// Collapsed, copy-exact preview for CopyButton payloads the page doesn't otherwise render
// (founder rule: anything that can be copied shows its code — a "Copy markdown" button that
// copies invisible text is a trust gap). Server component: plain <details>, no JS. The <pre>
// wraps (`whitespace-pre-wrap break-all`) so long one-line snippets never force horizontal
// scroll at 375px, and long exports scroll vertically inside a capped box instead of eating
// the page.
export default function CopyPreview({ summary, text }: { summary: string; text: string }) {
  return (
    <details className="min-w-0 text-xs">
      <summary className="cursor-pointer text-zinc-500 transition hover:text-emerald-300">{summary}</summary>
      <pre className="mt-1.5 max-h-64 overflow-y-auto whitespace-pre-wrap break-all rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 font-mono text-[11px] leading-relaxed text-zinc-300">
        {text}
      </pre>
    </details>
  )
}
