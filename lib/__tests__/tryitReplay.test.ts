// Pure tests for the microterminal's replay logic and probe-result rendering
// (lib/tryitReplay.ts) plus the server-side story/eligibility assembly (lib/tryit.ts) against
// the committed data corpus.
import { describe, expect, it } from 'vitest'
import { mcpEndpointFor } from '../mcpEndpoints'
import { buildRecordedStories, hasTryIt, processesFeaturing } from '../tryit'
import { probeResultLines, replayCharCount, stripSgr } from '../tryitReplay'
import { loadCategory } from '../data'

describe('replayCharCount', () => {
  it('is clamped, monotonic, and paced at msPerChar', () => {
    expect(replayCharCount(-5, 100)).toBe(0)
    expect(replayCharCount(0, 100)).toBe(0)
    expect(replayCharCount(80, 100, 8)).toBe(10)
    expect(replayCharCount(799, 100, 8)).toBe(99)
    expect(replayCharCount(10_000, 100, 8)).toBe(100) // never past the end
    expect(replayCharCount(10_000, 0)).toBe(0)
    // monotonic in elapsed time
    let prev = 0
    for (let t = 0; t < 1000; t += 7) {
      const now = replayCharCount(t, 100, 8)
      expect(now).toBeGreaterThanOrEqual(prev)
      prev = now
    }
  })

  it('guards a zero/negative msPerChar instead of dividing by zero', () => {
    expect(replayCharCount(50, 100, 0)).toBe(50)
  })
})

describe('stripSgr', () => {
  it('drops color sequences and keeps text', () => {
    expect(stripSgr('\x1b[1mserver\x1b[0m: nginx')).toBe('server: nginx')
  })
})

describe('probeResultLines', () => {
  it('renders auth-required as proof of life, never as failure', () => {
    const lines = probeResultLines({ reachable: true, authRequired: true, httpStatus: 401, oauth: true })
    expect(lines[0]).toBe('← HTTP 401 unauthorized (OAuth) — server is live, auth required')
  })

  it('renders a keyless handshake with the tool catalog (ellipsis when capped)', () => {
    const lines = probeResultLines({
      reachable: true,
      authRequired: false,
      handshake: true,
      serverInfo: { name: 'vendor-mcp', version: '2.0' },
      protocolVersion: '2025-06-18',
      toolCount: 12,
      toolNames: ['a', 'b'],
    })
    expect(lines[0]).toBe('← initialized — vendor-mcp v2.0 (protocol 2025-06-18)')
    expect(lines[1]).toBe('→ tools/list')
    expect(lines[2]).toBe('← 12 tools: a, b, …')
  })

  it('reports unreachable, transport errors, and non-MCP responses honestly', () => {
    expect(probeResultLines({ reachable: false })[0]).toMatch(/unreachable/)
    expect(probeResultLines({ error: 'rate limited' })[0]).toBe('← probe failed: rate limited')
    expect(probeResultLines({ reachable: true, authRequired: false, handshake: false, httpStatus: 503 })[0]).toMatch(/HTTP 503/)
  })

  it('says so when tools/list needed auth after a keyless initialize', () => {
    const lines = probeResultLines({ reachable: true, authRequired: false, handshake: true, serverInfo: { name: 'x', version: '1' }, protocolVersion: '2025-06-18' })
    expect(lines[2]).toMatch(/authenticated session/)
  })
})

describe('tryit assembly (committed corpus)', () => {
  it('stripe is tryable with recorded stories AND a live endpoint; its stories carry transcripts', () => {
    expect(hasTryIt('payments', 'stripe')).toBe(true)
    expect(mcpEndpointFor('payments', 'stripe')).toBe('https://mcp.stripe.com/')
    const { stories } = loadCategory('payments')
    const recorded = buildRecordedStories('payments', 'stripe', stories)
    expect(recorded.length).toBeGreaterThanOrEqual(3)
    for (const story of recorded) {
      expect(story.kind).toBe('recorded')
      expect(story.transcript?.length).toBeGreaterThan(0)
      expect(story.transcript).not.toMatch(/\x1b\[[0-9;]*m/) // SGR stripped for replay
      expect(story.title.length).toBeGreaterThan(0)
    }
  })

  it('mercury is tryable via the live MCP endpoint alone; unknown products are not', () => {
    expect(hasTryIt('startup-banking', 'mercury')).toBe(true)
    expect(buildRecordedStories('startup-banking', 'mercury', [])).toEqual([])
    expect(hasTryIt('payroll', 'gusto')).toBe(false) // docs-only MCP link, no proofs → no fake try
  })

  it('cross-links founder processes only for the arena the vendor is mapped to', () => {
    const stripeProcesses = processesFeaturing('payments', 'stripe')
    expect(stripeProcesses.length).toBeGreaterThan(0)
    for (const p of stripeProcesses) expect(p.slug).toMatch(/^[a-z0-9-]+$/)
    // stripe is mapped to 'payments' in VENDOR_ARENA — a different arena gets nothing.
    expect(processesFeaturing('mobile-payments', 'stripe')).toEqual([])
  })
})
