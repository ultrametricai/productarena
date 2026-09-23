// @vitest-environment jsdom
// The account-stack half of lib/myStack.ts: the picks-per-arena map store (StackMap v2 —
// ordered productId[] per arena, first = primary; localStorage + account sync, the
// lib/watchlist.ts pattern), the v1 → v2 migration, the pick helpers, and the
// upgraded-stack-advice math. Sync tests mirror lib/__tests__/watchlist.test.ts; advice tests
// recompute every delta from a fixture catalog shaped like real rankings.json-derived
// MyStackProduct rows.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isPicked,
  MAX_PICKS_PER_ARENA,
  mergeStackMaps,
  parseStackMap,
  primaryPick,
  readStackRaw,
  resetStackSyncForTests,
  serializeStackMap,
  STACK_KEY,
  stackAdvice,
  stackMapFromList,
  stackPicks,
  syncStackFromServer,
  togglePick,
  writeStack,
  type MyStackProduct,
} from '@/lib/myStack'

function product(overrides: Partial<MyStackProduct>): MyStackProduct {
  return {
    id: 'p',
    name: 'P',
    vendor: 'P Inc',
    arenaId: 'payments',
    arenaName: 'Payments',
    type: 'commercial',
    aiEra: 50,
    agentReady: 50,
    confidence: 'B',
    rank: 1,
    fieldSize: 3,
    hasLogo: false,
    ...overrides,
  }
}

describe('parseStackMap — v2 arrays, v1 strings, junk', () => {
  it('parses a stored v2 arenaId → productId[] object, order preserved', () => {
    expect(parseStackMap('{"payments":["stripe","paddle"],"crm":["attio"]}')).toEqual({
      payments: ['stripe', 'paddle'],
      crm: ['attio'],
    })
  })

  it('migrates a v1 string value to a one-element array — losslessly, mixed shapes allowed', () => {
    expect(parseStackMap('{"payments":"stripe","crm":["attio","hubspot"]}')).toEqual({
      payments: ['stripe'],
      crm: ['attio', 'hubspot'],
    })
  })

  it('v1 → v2 round-trips losslessly through serialize', () => {
    const migrated = parseStackMap('{"payments":"stripe","crm":"attio"}')
    expect(migrated).toEqual({ payments: ['stripe'], crm: ['attio'] })
    expect(parseStackMap(serializeStackMap(migrated))).toEqual(migrated)
  })

  it('degrades anything malformed to an empty map', () => {
    expect(parseStackMap(null)).toEqual({})
    expect(parseStackMap('')).toEqual({})
    expect(parseStackMap('not json')).toEqual({})
    expect(parseStackMap('["stripe"]')).toEqual({})
    expect(parseStackMap('"stripe"')).toEqual({})
  })

  it('drops junk entries (non-string members, empties, dupes, emptied arenas) but keeps the rest', () => {
    expect(
      parseStackMap('{"payments":["stripe","",42,"stripe"],"crm":42,"payroll":"","hr":[],"":"x"}'),
    ).toEqual({ payments: ['stripe'] })
  })

  it('caps picks per arena at MAX_PICKS_PER_ARENA', () => {
    const many = JSON.stringify({ payments: Array.from({ length: 20 }, (_, i) => `p${i}`) })
    expect(parseStackMap(many).payments).toHaveLength(MAX_PICKS_PER_ARENA)
  })
})

describe('serializeStackMap', () => {
  it('is key-order independent (stable snapshots) while pick order is preserved', () => {
    expect(serializeStackMap({ b: ['2'], a: ['1'] })).toBe(serializeStackMap({ a: ['1'], b: ['2'] }))
    expect(serializeStackMap({ a: ['1', '3'], b: ['2'] })).toBe('{"a":["1","3"],"b":["2"]}')
  })
})

describe('pick helpers (stackPicks / isPicked / togglePick / primaryPick)', () => {
  const stack = { payments: ['stripe', 'paddle'], crm: ['attio'] }

  it('stackPicks / isPicked / primaryPick read the ordered list', () => {
    expect(stackPicks(stack, 'payments')).toEqual(['stripe', 'paddle'])
    expect(stackPicks(stack, 'unknown')).toEqual([])
    expect(isPicked(stack, 'payments', 'paddle')).toBe(true)
    expect(isPicked(stack, 'payments', 'ghost')).toBe(false)
    expect(primaryPick(stack, 'payments')).toBe('stripe')
    expect(primaryPick(stack, 'unknown')).toBeNull()
  })

  it('togglePick adds to the END (first stays primary) and never mutates the input', () => {
    const next = togglePick(stack, 'payments', 'square')
    expect(next.payments).toEqual(['stripe', 'paddle', 'square'])
    expect(stack.payments).toEqual(['stripe', 'paddle'])
    expect(togglePick(stack, 'hr', 'gusto')).toEqual({ ...stack, hr: ['gusto'] })
  })

  it('togglePick removes an existing pick; removing the LAST pick deletes the key', () => {
    expect(togglePick(stack, 'payments', 'stripe').payments).toEqual(['paddle'])
    expect(togglePick(stack, 'crm', 'attio')).toEqual({ payments: ['stripe', 'paddle'] })
  })

  it('togglePick is a no-op beyond MAX_PICKS_PER_ARENA', () => {
    const full = { payments: Array.from({ length: MAX_PICKS_PER_ARENA }, (_, i) => `p${i}`) }
    expect(togglePick(full, 'payments', 'one-more')).toBe(full)
  })
})

describe('mergeStackMaps', () => {
  it('the account pick LIST wins a per-arena conflict wholesale; device-only arenas are kept', () => {
    expect(
      mergeStackMaps({ payments: ['stripe'] }, { payments: ['paddle', 'square'], crm: ['attio'] }),
    ).toEqual({
      payments: ['stripe'],
      crm: ['attio'],
    })
    expect(mergeStackMaps({}, { crm: ['attio'] })).toEqual({ crm: ['attio'] })
    expect(mergeStackMaps({ crm: ['attio'] }, {})).toEqual({ crm: ['attio'] })
  })
})

describe('stackMapFromList (prefill from the free-form tool)', () => {
  it('keeps every pick per canonical arena in list order (first = primary), drops unknown ids', () => {
    const rows = [
      product({ id: 'stripe', arenaId: 'payments' }),
      product({ id: 'paddle', arenaId: 'payments', rank: 2 }),
      product({ id: 'attio', arenaId: 'crm', arenaName: 'CRM' }),
    ]
    expect(stackMapFromList(['stripe', 'paddle', 'attio', 'ghost'], rows)).toEqual({
      payments: ['stripe', 'paddle'],
      crm: ['attio'],
    })
  })
})

// Same jsdom localStorage stand-in as lib/__tests__/watchlist.test.ts.
function stubLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  })
}

const jsonOk = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })

describe('account sync (syncStackFromServer / write push-through)', () => {
  beforeEach(() => {
    stubLocalStorage()
    resetStackSyncForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('merges the account map into localStorage (account wins per arena) and uploads device-only picks — migrating v1 shapes from BOTH sides', async () => {
    // Device stored the old v1 one-pick shape; the account KV answers v1 too — both migrate.
    window.localStorage.setItem(STACK_KEY, '{"payments":"paddle","crm":"attio"}')
    const fetchMock = vi.fn().mockResolvedValue(jsonOk({ ok: true, stack: { payments: 'stripe' } }))
    vi.stubGlobal('fetch', fetchMock)

    await syncStackFromServer()

    expect(parseStackMap(readStackRaw())).toEqual({ payments: ['stripe'], crm: ['attio'] })
    // GET, then the merged PUT (the device had a pick the account was missing) — written as v2.
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [putUrl, putInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(putUrl).toBe('/productarena/api/my-stack')
    expect(putInit.method).toBe('PUT')
    expect(JSON.parse(String(putInit.body))).toEqual({ stack: { payments: ['stripe'], crm: ['attio'] } })
  })

  it('a v2 multi-pick account map syncs as-is (order preserved)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonOk({ ok: true, stack: { 'startup-banking': ['mercury', 'brex'] } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await syncStackFromServer()
    expect(parseStackMap(readStackRaw())).toEqual({ 'startup-banking': ['mercury', 'brex'] })
    // GET + the merge's local write pushing the (identical) map back — order intact both ways.
    const put = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')
    expect(put).toBeDefined()
    expect(JSON.parse(String((put![1] as RequestInit).body))).toEqual({
      stack: { 'startup-banking': ['mercury', 'brex'] },
    })
  })

  it('after a successful sync every local write pushes to the account; before it, none do', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonOk({ ok: true, stack: {} }))
    vi.stubGlobal('fetch', fetchMock)

    writeStack({ payments: ['stripe'] }) // sync not confirmed yet — stays device-local
    expect(fetchMock).not.toHaveBeenCalled()

    await syncStackFromServer() // GET {}, local has picks → merged PUT
    const putsAfterSync = fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')
    expect(putsAfterSync).toHaveLength(1)

    writeStack({ payments: ['stripe'], crm: ['attio'] })
    const puts = fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')
    expect(puts).toHaveLength(2)
    expect(JSON.parse(String((puts[1][1] as RequestInit).body))).toEqual({
      stack: { crm: ['attio'], payments: ['stripe'] },
    })
  })

  it('does nothing on 401/404/network failure or a junk payload — the stack stays device-local', async () => {
    window.localStorage.setItem(STACK_KEY, '{"payments":["stripe"]}')
    for (const impl of [
      vi.fn().mockResolvedValue(new Response('{"error":"no session"}', { status: 401 })),
      vi.fn().mockResolvedValue(new Response('nope', { status: 404 })),
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
      vi.fn().mockResolvedValue(jsonOk({ ok: true })), // no stack object
      vi.fn().mockResolvedValue(jsonOk({ ok: true, stack: ['stripe'] })), // wrong shape
    ]) {
      resetStackSyncForTests()
      vi.stubGlobal('fetch', impl)
      await syncStackFromServer()
      expect(parseStackMap(readStackRaw())).toEqual({ payments: ['stripe'] })
      writeStack({ payments: ['stripe'], crm: ['attio'] })
      expect(impl.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')).toHaveLength(0)
      window.localStorage.setItem(STACK_KEY, '{"payments":["stripe"]}')
    }
  })

  it('skips the PUT entirely when device and account already agree', async () => {
    window.localStorage.setItem(STACK_KEY, '{"crm":["attio"],"payments":["stripe"]}')
    const fetchMock = vi.fn().mockResolvedValue(jsonOk({ ok: true, stack: { payments: ['stripe'], crm: ['attio'] } }))
    vi.stubGlobal('fetch', fetchMock)
    await syncStackFromServer()
    expect(fetchMock).toHaveBeenCalledTimes(1) // just the GET
  })
})

describe('stackAdvice — every delta recomputed from the fixture leaderboard', () => {
  const catalog = [
    product({ id: 'leader', name: 'Leader', arenaId: 'payments', aiEra: 85, agentReady: 90, rank: 1, fieldSize: 4 }),
    product({ id: 'second', name: 'Second', arenaId: 'payments', aiEra: 78, agentReady: 70, rank: 2, fieldSize: 4 }),
    product({ id: 'mine', name: 'Mine', arenaId: 'payments', aiEra: 60.5, agentReady: 50, rank: 3, fieldSize: 4 }),
    product({ id: 'below', name: 'Below', arenaId: 'payments', aiEra: 40, rank: 4, fieldSize: 4 }),
    product({ id: 'attio', name: 'Attio', arenaId: 'crm', arenaName: 'CRM', aiEra: 72, agentReady: 80, rank: 1, fieldSize: 2 }),
    product({ id: 'unscored', name: 'Unscored', arenaId: 'crm', arenaName: 'CRM', aiEra: null, agentReady: null, rank: 2, fieldSize: 2 }),
  ]

  it('per pick: rank, delta to the leader (PA + agent-ready), top-2 upgrade candidates with deltas', () => {
    const advice = stackAdvice({ payments: ['mine'] }, catalog)
    expect(advice.picks).toHaveLength(1)
    const p = advice.picks[0]
    expect(p.pick.rank).toBe(3)
    expect(p.coPicks).toEqual([])
    expect(p.leader.id).toBe('leader')
    expect(p.paDelta).toBe(24.5) // 85 − 60.5
    expect(p.agentReadyDelta).toBe(40) // 90 − 50
    // Top 2 ABOVE the pick, best first — 'below' (40) never appears.
    expect(p.upgrades.map((u) => u.product.id)).toEqual(['leader', 'second'])
    expect(p.upgrades[1].paDelta).toBe(17.5) // 78 − 60.5
    expect(p.upgrades[1].agentReadyDelta).toBe(20) // 70 − 50
  })

  it('a leading pick has no upgrades and zero delta', () => {
    const advice = stackAdvice({ payments: ['leader'] }, catalog)
    expect(advice.picks[0].upgrades).toEqual([])
    expect(advice.picks[0].paDelta).toBe(0)
  })

  it('stack score = mean of scored picks; best possible = mean of those arenas\' leaders', () => {
    const advice = stackAdvice({ payments: ['mine'], crm: ['attio'] }, catalog)
    expect(advice.stackScore).toBe(66.3) // (60.5 + 72) / 2 = 66.25 → 66.3
    expect(advice.bestPossible).toBe(78.5) // (85 + 72) / 2
  })

  it('drops picks the catalog does not judge in that arena; empty stack yields null scores', () => {
    expect(stackAdvice({ payments: ['ghost'], unknown: ['x'] }, catalog).picks).toEqual([])
    expect(stackAdvice({}, catalog)).toEqual({ picks: [], stackScore: null, bestPossible: null })
  })

  it('an unscored pick is listed (leader delta null) but excluded from the stack score', () => {
    const advice = stackAdvice({ crm: ['unscored'] }, catalog)
    expect(advice.picks).toHaveLength(1)
    expect(advice.picks[0].paDelta).toBeNull()
    expect(advice.picks[0].upgrades).toEqual([])
    expect(advice.stackScore).toBeNull()
  })

  it('multi-pick arena: the BEST pick fronts the advice, the others are coPicks (order kept) — never errors', () => {
    // Stack order puts the weaker pick first — the advice still runs against the best one.
    const advice = stackAdvice({ payments: ['mine', 'second'] }, catalog)
    expect(advice.picks).toHaveLength(1)
    const p = advice.picks[0]
    expect(p.pick.id).toBe('second') // 78 beats 60.5, whatever the stack order says
    expect(p.coPicks.map((c) => c.id)).toEqual(['mine'])
    expect(p.paDelta).toBe(7) // 85 − 78 — the best pick vs the leader
    // Upgrade candidates never include the reader's OWN picks: only 'leader' is above 'second'.
    expect(p.upgrades.map((u) => u.product.id)).toEqual(['leader'])
    // Stack score counts the best pick per arena, not the mean of co-picks.
    expect(advice.stackScore).toBe(78)
  })

  it('multi-pick migrate-first: EVERY shutdown pick surfaces in shutdownPicks, not just the best', () => {
    const dying = product({ id: 'dying', name: 'Dying', arenaId: 'payments', aiEra: 30, rank: 5, fieldSize: 4, shutdown: 'Closing 2027-01-01.' })
    const advice = stackAdvice({ payments: ['leader', 'dying'] }, [...catalog, dying])
    const p = advice.picks[0]
    expect(p.pick.id).toBe('leader')
    expect(p.shutdownPicks.map((s) => s.id)).toEqual(['dying'])
    expect(p.coPicks.map((c) => c.id)).toEqual(['dying'])
  })
})
