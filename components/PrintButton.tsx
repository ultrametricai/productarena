'use client'

// The procurement report's "Download PDF" affordance — deliberately just window.print(): the
// report page ships print CSS (see globals.css's .print-report rules), so the browser's own
// save-as-PDF dialog produces the artifact with zero PDF dependencies. Hidden in the print
// output itself.
export default function PrintButton({ label = 'Download PDF' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-emerald-400/60 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/10 print:hidden"
    >
      {label}
    </button>
  )
}
