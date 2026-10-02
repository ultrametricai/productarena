'use client'

import { useState } from 'react'

// Tiny inline copy control for the sim's first-party Ultrametric CLI command lines (founder
// batch 2026-10-02, item 5 — the lowest-risk, clearly-honest extension): copies the already
// rendered shipped command (lib/ultrametricCli.ts) to the clipboard. Display-only convenience —
// it renders only inside the explicitly-labeled first-party UM-CLI surfaces, never touches the
// judged picks, scores, or the run state. Sized for the 11px line it sits on (the shared
// components/CopyButton.tsx is the chunkier standalone variant).
export default function VsCopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API unavailable (e.g. insecure context) — silently no-op.
    }
  }

  return (
    <button
      type="button"
      data-testid="vs-um-cli-copy"
      onClick={onCopy}
      title={copied ? 'Copied' : `Copy: ${command}`}
      className={`rounded border px-1 py-px font-mono text-[10px] transition ${
        copied
          ? 'border-emerald-400/60 text-emerald-300'
          : 'border-zinc-800 text-zinc-500 hover:border-emerald-400/60 hover:text-emerald-300'
      }`}
    >
      {/* aria-live so the copied confirmation is announced, not just shown. */}
      <span aria-live="polite">{copied ? 'copied ✓' : 'copy'}</span>
    </button>
  )
}
