// The one compact rendered-date format, sitewide: "Sep 1 '26". Founder rule: a rendered date
// always carries its year — "Sep 1" alone is ambiguous the moment a trend or history line spans
// a New Year (and score history will). Two-digit year keeps sparkline captions and tooltips
// tight; full ISO (YYYY-MM-DD) stays the format for machine-ish surfaces like the changelog's
// mono day stamp and "Evidence as of" (lib/freshness.ts).
//
// Accepts both bare days ("2026-09-01") and full ISO timestamps — Date parses both as UTC, and
// we format in UTC so a date never slips a day depending on the build machine's timezone.
const MONTH_DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export function shortDate(iso: string): string {
  const d = new Date(iso)
  return `${MONTH_DAY.format(d)} '${String(d.getUTCFullYear() % 100).padStart(2, '0')}`
}
