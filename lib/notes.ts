import fs from 'node:fs'
import path from 'node:path'

// Arena Notes: editorial, signed-POV essays drafted by pipeline/scripts/generate-arena-notes.ts
// into drafts/arena-notes/YYYY-MM-DD.md. Drafts are NEVER auto-published: every generated file
// carries `status: draft — requires founder sign-off before publishing` in its frontmatter, and
// /notes (app/notes/page.tsx) renders ONLY files whose status is exactly `published`. Publishing
// is a deliberate human act — a founder reads the draft, edits the frontmatter to
// `status: published`, and commits. Same tolerant-optional contract as lib/proofs.ts: no drafts
// directory (or none published) renders an honest empty state, never an error.

export interface NoteFrontmatter {
  [key: string]: string
}

export interface ParsedNote {
  frontmatter: NoteFrontmatter
  body: string
}

export interface ArenaNote {
  /** YYYY-MM-DD, from the filename. */
  date: string
  title: string
  body: string
}

// Deliberately tiny frontmatter parser — exactly the `key: value` lines the generator emits
// between `---` fences, nothing more (no YAML nesting, no arrays). A file without a frontmatter
// block parses as { frontmatter: {}, body: <whole file> }, which can never be "published".
export function parseFrontmatter(markdown: string): ParsedNote {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return { frontmatter: {}, body: markdown }
  const frontmatter: NoteFrontmatter = {}
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    const value = line.slice(colon + 1).trim()
    if (key) frontmatter[key] = value
  }
  return { frontmatter, body: markdown.slice(match[0].length) }
}

// The publish gate: status must be exactly `published`. The generator's draft status is a whole
// sentence ("draft — requires founder sign-off before publishing") precisely so no substring or
// prefix check could ever mistake it for published.
export function isPublished(frontmatter: NoteFrontmatter): boolean {
  return frontmatter.status === 'published'
}

const DEFAULT_DIR = () => path.join(process.cwd(), 'drafts', 'arena-notes')

// Published notes only, newest first. Missing directory → [] (the drafts lane may not exist in
// every checkout), unparseable/unpublished files are skipped, never an error.
export function loadPublishedNotes(dir: string = DEFAULT_DIR()): ArenaNote[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .reverse()
    .flatMap((f) => {
      const { frontmatter, body } = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'))
      if (!isPublished(frontmatter)) return []
      const date = f.slice(0, -3)
      return [{ date, title: frontmatter.title ?? `Arena Notes — ${date}`, body: body.trim() }]
    })
}
