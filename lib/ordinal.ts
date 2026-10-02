// English ordinals for RANK positions (founder 2026-10-02: a ranking cell reads '1st, 2nd,
// 3rd', never a bare '1' or '#1' — the number alone reads as an id or a count). Display-only:
// sorting and judged data always use the number; this formats it at the render site. Pure and
// client-safe (no node builtins, no React) — the lib/dates.ts formatting-helper posture.
//
// NOT for '#N of M' phrasings: those stay descriptive where the M carries the honesty (ladder
// identity in SimRolePicker, 'Rank #N of M' receipts) — judgment per render site.
export function ordinal(n: number): string {
  const int = Math.trunc(n)
  const mod100 = Math.abs(int) % 100
  const mod10 = Math.abs(int) % 10
  const suffix =
    mod100 >= 11 && mod100 <= 13 ? 'th' : mod10 === 1 ? 'st' : mod10 === 2 ? 'nd' : mod10 === 3 ? 'rd' : 'th'
  return `${int}${suffix}`
}
