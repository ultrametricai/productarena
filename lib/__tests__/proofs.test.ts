import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  containsForbiddenSecretPattern,
  loadProofIndex,
  proofsForProduct,
  readProofTranscript,
  redactSecrets,
  sanitizeForPublication,
  sanitizeTranscript,
  type ProofIndexEntry,
} from '@/lib/proofs'

let tmp: string | undefined
afterEach(() => { if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); tmp = undefined })

function fixtureDir(): string {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-proofs-'))
  return tmp
}

const ENTRY: ProofIndexEntry = {
  probeId: 'cli-version',
  productId: 'claude-code',
  storyIds: ['agentic-official-cli'],
  command: 'claude --version',
  recordedAt: '2026-09-03T00:00:00.000Z',
  exitCode: 0,
  kind: 'terminal',
  file: 'claude-code/cli-version.txt',
}

function writeIndex(dir: string, categoryId: string, proofs: ProofIndexEntry[]) {
  const pdir = path.join(dir, categoryId, 'proofs')
  fs.mkdirSync(pdir, { recursive: true })
  fs.writeFileSync(path.join(pdir, 'index.json'), JSON.stringify({ generatedAt: '2026-09-03T00:00:00.000Z', proofs }))
}

describe('loadProofIndex / proofsForProduct', () => {
  it('returns [] when the category has no proofs at all', () => {
    const dir = fixtureDir()
    fs.mkdirSync(path.join(dir, 'ai-coding'), { recursive: true })
    expect(loadProofIndex('ai-coding', dir)).toEqual([])
  })

  it('loads and filters entries by product', () => {
    const dir = fixtureDir()
    const other = { ...ENTRY, probeId: 'x', productId: 'codex', file: 'codex/x.txt' }
    writeIndex(dir, 'ai-coding', [ENTRY, other])
    expect(loadProofIndex('ai-coding', dir)).toHaveLength(2)
    expect(proofsForProduct('ai-coding', 'claude-code', dir)).toEqual([ENTRY])
    expect(proofsForProduct('ai-coding', 'nope', dir)).toEqual([])
  })

  it('rejects a malformed index', () => {
    const dir = fixtureDir()
    writeIndex(dir, 'ai-coding', [{ ...ENTRY, kind: 'hologram' } as unknown as ProofIndexEntry])
    expect(() => loadProofIndex('ai-coding', dir)).toThrow()
  })
})

describe('readProofTranscript', () => {
  it('reads a terminal transcript relative to the proofs dir', () => {
    const dir = fixtureDir()
    writeIndex(dir, 'ai-coding', [ENTRY])
    const f = path.join(dir, 'ai-coding', 'proofs', 'claude-code', 'cli-version.txt')
    fs.mkdirSync(path.dirname(f), { recursive: true })
    fs.writeFileSync(f, '$ claude --version\n2.1.259 (Claude Code)\n')
    expect(readProofTranscript('ai-coding', ENTRY, dir)).toContain('2.1.259')
  })

  it('returns null for video entries, missing files, and path escapes', () => {
    const dir = fixtureDir()
    writeIndex(dir, 'ai-coding', [ENTRY])
    expect(readProofTranscript('ai-coding', { ...ENTRY, kind: 'video', file: 'claude-code/x.webm' }, dir)).toBeNull()
    expect(readProofTranscript('ai-coding', ENTRY, dir)).toBeNull() // file never written
    expect(readProofTranscript('ai-coding', { ...ENTRY, file: '../../../etc/passwd' }, dir)).toBeNull()
  })
})

describe('sanitizeTranscript', () => {
  it('normalizes pty artifacts: CRLF, ^D, backspaces, cursor escapes', () => {
    const raw = '\x04\x08\x08hello world\r\n\x1b[?25hnext\r\n'
    expect(sanitizeTranscript(raw)).toBe('hello world\nnext\n')
  })

  it('applies backspaces like a terminal would', () => {
    expect(sanitizeTranscript('abcd\x08\x08X\n')).toBe('abX\n')
  })

  it('keeps SGR color sequences but strips other CSI/OSC noise', () => {
    const raw = '\x1b]0;title\x07\x1b[31mred\x1b[0m \x1b[2Jplain\n'
    expect(sanitizeTranscript(raw)).toBe('\x1b[31mred\x1b[0m plain\n')
  })

  it('collapses runs of blank lines and trailing whitespace', () => {
    expect(sanitizeTranscript('a   \n\n\n\n\nb\n')).toBe('a\n\nb\n')
  })
})

describe('secret redaction', () => {
  it('redacts sk- style values and key=value assignments', () => {
    const out = redactSecrets('ANTHROPIC_API_KEY=sk-ant-abc123 Authorization: Bearer xyz')
    expect(out).not.toMatch(/sk-|key|token/i)
    expect(out).toContain('[redacted]')
  })

  it('redacts even prose mentions so the forbidden pattern can never survive', () => {
    const out = redactSecrets('Use an API key or an OAuth token here')
    expect(containsForbiddenSecretPattern(out)).toBe(false)
  })

  it('sanitizeForPublication output never matches the forbidden pattern', () => {
    const out = sanitizeForPublication('paste your sk-live-9999 TOKEN here\r\n')
    expect(containsForbiddenSecretPattern(out)).toBe(false)
    expect(out.endsWith('\n')).toBe(true)
  })

  it('leaves innocent transcripts untouched', () => {
    const s = 'codex-cli 0.142.0\n'
    expect(sanitizeForPublication(s)).toBe(s)
  })
})
