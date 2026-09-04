'use client'

import { useState } from 'react'

// Tiny generic copy-to-clipboard button (labelled, not icon-only — used where the copied text
// isn't rendered beside it, unlike InstallCommands' per-command icon). Client component by
// necessity (navigator.clipboard); keep the payload prebuilt server-side and pass it as a
// string prop so no data assembly crosses the boundary.
export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API unavailable (e.g. insecure context) — silently no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      title={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
      className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs transition ${
        copied
          ? 'border-emerald-400/60 text-emerald-300'
          : 'border-zinc-800 text-zinc-300 hover:border-emerald-400/60 hover:text-emerald-300'
      }`}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  )
}
