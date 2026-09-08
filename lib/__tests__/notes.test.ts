import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { isPublished, loadPublishedNotes, parseFrontmatter } from '@/lib/notes'

let tmp: string | undefined
afterEach(() => { if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); tmp = undefined })

function fixtureDir(): string {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-notes-'))
  return tmp
}

const DRAFT = `---
status: draft — requires founder sign-off before publishing
title: The week the race tightened
date: 2026-09-08
---

Body paragraph one (source: /changelog).
`

const PUBLISHED = `---
status: published
title: A published note
date: 2026-09-01
---

Published body.
`

describe('parseFrontmatter', () => {
  it('splits frontmatter keys from the body', () => {
    const { frontmatter, body } = parseFrontmatter(DRAFT)
    expect(frontmatter.status).toBe('draft — requires founder sign-off before publishing')
    expect(frontmatter.title).toBe('The week the race tightened')
    expect(frontmatter.date).toBe('2026-09-08')
    expect(body.trim()).toBe('Body paragraph one (source: /changelog).')
  })

  it('keeps colons inside values intact', () => {
    const { frontmatter } = parseFrontmatter('---\ntitle: Notes: a subtitle\n---\nbody')
    expect(frontmatter.title).toBe('Notes: a subtitle')
  })

  it('treats a file without frontmatter as all body (never publishable)', () => {
    const { frontmatter, body } = parseFrontmatter('just markdown')
    expect(frontmatter).toEqual({})
    expect(body).toBe('just markdown')
    expect(isPublished(frontmatter)).toBe(false)
  })
})

describe('isPublished', () => {
  it('requires status to be exactly "published"', () => {
    expect(isPublished({ status: 'published' })).toBe(true)
    expect(isPublished({ status: 'draft — requires founder sign-off before publishing' })).toBe(false)
    expect(isPublished({ status: 'Published' })).toBe(false)
    expect(isPublished({ status: 'published (pending)' })).toBe(false)
    expect(isPublished({})).toBe(false)
  })
})

describe('loadPublishedNotes', () => {
  it('returns [] for a missing directory', () => {
    expect(loadPublishedNotes(path.join(os.tmpdir(), 'pa-notes-does-not-exist'))).toEqual([])
  })

  it('renders only published notes, newest first, and skips drafts', () => {
    const dir = fixtureDir()
    fs.writeFileSync(path.join(dir, '2026-09-08.md'), DRAFT)
    fs.writeFileSync(path.join(dir, '2026-09-01.md'), PUBLISHED)
    fs.writeFileSync(path.join(dir, '2026-08-25.md'), PUBLISHED.replace('A published note', 'Older note'))
    fs.writeFileSync(path.join(dir, 'not-a-note.md'), PUBLISHED)
    const notes = loadPublishedNotes(dir)
    expect(notes.map((n) => n.date)).toEqual(['2026-09-01', '2026-08-25'])
    expect(notes[0].title).toBe('A published note')
    expect(notes[0].body).toBe('Published body.')
  })

  it('falls back to a dated title when the frontmatter has none', () => {
    const dir = fixtureDir()
    fs.writeFileSync(path.join(dir, '2026-09-01.md'), '---\nstatus: published\n---\nbody')
    expect(loadPublishedNotes(dir)[0].title).toBe('Arena Notes — 2026-09-01')
  })
})
