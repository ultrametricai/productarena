import type { ReactNode } from 'react'

// Deliberately tiny markdown-to-JSX for the committed weekly reports (app/reports) — exactly
// the constructs pipeline/scripts/generate-weekly-report.ts emits (headings, lists, links,
// bold/italic, hr) and nothing more. No dependency, no HTML pass-through (everything renders as
// text nodes, so a report can never inject markup); a construct this doesn't know just renders
// as its literal text — clean over clever.

const INLINE = /(\[[^\]]*\]\([^)\s]*\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of text.matchAll(INLINE)) {
    if (match.index! > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    if (token.startsWith('[')) {
      const close = token.indexOf('](')
      const label = token.slice(1, close)
      const href = token.slice(close + 2, -1)
      nodes.push(
        <a key={key++} href={href} className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200">
          {label}
        </a>,
      )
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key++} className="font-semibold text-zinc-100">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>)
    }
    last = match.index! + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export default function SimpleMarkdown({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n')
  const blocks: ReactNode[] = []
  let list: string[] = []
  let key = 0

  const flushList = () => {
    if (list.length === 0) return
    blocks.push(
      <ul key={key++} className="list-disc space-y-1 pl-5 text-sm text-zinc-400 marker:text-zinc-600">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    )
    list = []
  }

  for (const line of lines) {
    if (line.startsWith('- ')) {
      list.push(line.slice(2))
      continue
    }
    flushList()
    if (line.trim() === '') continue
    if (line === '---') {
      blocks.push(<hr key={key++} className="border-zinc-800" />)
    } else if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={key++} className="font-display leading-[1.1] pt-1 text-sm font-semibold text-zinc-200">
          {renderInline(line.slice(4))}
        </h4>,
      )
    } else if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={key++} className="font-display leading-[1.1] pt-2 text-base font-semibold">
          {renderInline(line.slice(3))}
        </h3>,
      )
    } else if (line.startsWith('# ')) {
      blocks.push(
        <h2 key={key++} className="font-display leading-[1.1] text-xl font-bold tracking-tight">
          {renderInline(line.slice(2))}
        </h2>,
      )
    } else {
      blocks.push(
        <p key={key++} className="text-sm text-zinc-400">
          {renderInline(line)}
        </p>,
      )
    }
  }
  flushList()

  return <div className="space-y-3">{blocks}</div>
}
