import { redirect } from 'next/navigation'

// Retired for now (founder 2026-09-29: "we don't need this changelog yet") — the generated
// score-history data stays committed; the page can return when wanted. Old links land on the
// rankings rather than 404ing (the /mcp retirement pattern).
export default function ChangelogRetired() {
  redirect('/')
}
