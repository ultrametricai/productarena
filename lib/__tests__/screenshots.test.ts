import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hasScreenshots } from '@/lib/screenshots'

let dir: string

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-screenshots-'))
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('hasScreenshots', () => {
  it('returns an empty array when no screenshots exist', () => {
    expect(hasScreenshots('ghost', dir)).toEqual([])
  })

  it('returns an empty array when the directory itself is missing', () => {
    expect(hasScreenshots('ghost', path.join(dir, 'nope'))).toEqual([])
  })

  it('finds a home screenshot and returns its public path', () => {
    fs.writeFileSync(path.join(dir, 'acme-home.webp'), 'x')
    const shots = hasScreenshots('acme', dir)
    expect(shots).toHaveLength(1)
    expect(shots[0].kind).toBe('home')
    expect(shots[0].path).toBe('/screenshots/acme-home.webp')
    expect(shots[0].capturedAt).toBeInstanceOf(Date)
  })

  it('returns home before docs when both exist', () => {
    fs.writeFileSync(path.join(dir, 'acme-docs.webp'), 'x')
    fs.writeFileSync(path.join(dir, 'acme-home.webp'), 'x')
    expect(hasScreenshots('acme', dir).map((s) => s.kind)).toEqual(['home', 'docs'])
  })

  it('accepts a png fallback but prefers webp for the same kind', () => {
    fs.writeFileSync(path.join(dir, 'acme-home.png'), 'x')
    fs.writeFileSync(path.join(dir, 'acme-docs.png'), 'x')
    fs.writeFileSync(path.join(dir, 'acme-docs.webp'), 'x')
    const shots = hasScreenshots('acme', dir)
    expect(shots.map((s) => s.path)).toEqual(['/screenshots/acme-home.png', '/screenshots/acme-docs.webp'])
  })

  it('does not match another product\'s screenshots', () => {
    fs.writeFileSync(path.join(dir, 'other-home.webp'), 'x')
    expect(hasScreenshots('acme', dir)).toEqual([])
  })
})
