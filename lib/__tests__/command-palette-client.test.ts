import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const entries = [{ type: 'page', label: 'Search result', sublabel: 'Details', href: '/result' }]
const fetchIndex = vi.fn()
beforeEach(() => {
  vi.resetModules()
  fetchIndex.mockReset()
  vi.stubGlobal('fetch', fetchIndex)
})
afterEach(() => vi.unstubAllGlobals())

const response = (body: unknown = entries) => ({ ok: true, json: async () => body })

describe('shared palette requests', () => {
  it('coalesces concurrent callers and caches successful entries by version', async () => {
    let resolve!: (value: ReturnType<typeof response>) => void
    fetchIndex.mockReturnValueOnce(new Promise((done) => { resolve = done }))
    const { loadCommandPaletteIndex } = await import('../command-palette-client')
    const first = loadCommandPaletteIndex('/search-index.json?v=one')
    expect(loadCommandPaletteIndex('/search-index.json?v=one')).toBe(first)
    resolve(response())
    expect(await first).toEqual(entries)
    expect(await loadCommandPaletteIndex('/search-index.json?v=one')).toEqual(entries)
    expect(fetchIndex).toHaveBeenCalledTimes(1)
    fetchIndex.mockResolvedValueOnce(response([{ ...entries[0], label: 'Updated' }]))
    expect(await loadCommandPaletteIndex('/search-index.json?v=two')).toEqual([{ ...entries[0], label: 'Updated' }])
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['HTTP failure', () => Promise.resolve({ ok: false })],
    ['network failure', () => Promise.reject(new Error('offline'))],
    ['invalid JSON', () => Promise.resolve({ ok: true, json: async () => { throw new SyntaxError('invalid') } })],
    ['invalid entry', () => Promise.resolve(response([{ type: 'unexpected' }]))],
    ['invalid keywords', () => Promise.resolve(response([{ ...entries[0], keywords: [null] }]))],
  ])('evicts %s so the next open or retry can recover', async (_name, failure) => {
    fetchIndex.mockImplementationOnce(failure).mockResolvedValueOnce(response())
    const { loadCommandPaletteIndex } = await import('../command-palette-client')
    await expect(loadCommandPaletteIndex('/search-index.json?v=one')).rejects.toThrow()
    expect(await loadCommandPaletteIndex('/search-index.json?v=one')).toEqual(entries)
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })
})
