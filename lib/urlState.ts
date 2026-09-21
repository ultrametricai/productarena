// Shareable-view URL state (founder 2026-09-21: "if a user clicks on a 'rank by' or processes,
// change the URL so if they share the URL by copying it, the other user gets the view they were
// in"). Every page is fully static (SSG) — there are no server searchParams — so URL state is a
// purely client-side contract:
//   READ on mount only (never during render/SSR): the static HTML stays byte-identical and
//   hydrates with zero mismatches — the same personalization contract as lib/processLens.ts;
//   the shared URL reproduces the view after hydration.
//   WRITE with history.replaceState (never router.push — no navigation, no scroll reset, no
//   history spam), the components/CompareBuilder.tsx / StackBattle.tsx precedent.
// Defaults NEVER appear in the URL: a pristine view has a clean URL, and clearing a control
// removes its param — callers pass null for a default value. setParams PATCHES the existing
// query, so multiple components on one page (homepage: HomeModes + MegaTable + ProcessesTable)
// each own their keys and never clobber each other's.
//
// basePath note: the next URL is always rebuilt from location.pathname (which already carries
// next.config.ts's '/productarena' basePath) + the new search + the existing hash — never a
// hardcoded path.

/** Current query params — empty during SSR, so mount-effect reads are the only sane callsite. */
export function readParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

/** One param's value — null during SSR and when absent. */
export function readParam(key: string): string | null {
  return readParams().get(key)
}

/** Every value of a repeatable param (e.g. ?via=a:b&via=c:d) — [] during SSR / when absent. */
export function readParamAll(key: string): string[] {
  return readParams().getAll(key)
}

/**
 * Patch the query in place: a string sets the key, null (or '') deletes it — untouched keys
 * survive, so co-mounted components compose. No-op during SSR and when the URL wouldn't change
 * (no redundant replaceState calls).
 */
export function setParams(patch: Record<string, string | null>): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === '') params.delete(key)
    else params.set(key, value)
  }
  const qs = params.toString()
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next === current) return
  window.history.replaceState(null, '', next)
}
