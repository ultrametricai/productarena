import { describe, expect, it } from 'vitest'
import { parseWatchlist, toggleWatchlistId } from '@/lib/watchlist'

describe('parseWatchlist', () => {
  it('parses a stored JSON array of ids', () => {
    expect(parseWatchlist('["supabase","linear"]')).toEqual(['supabase', 'linear'])
  })

  it('degrades anything malformed to an empty list', () => {
    expect(parseWatchlist(null)).toEqual([])
    expect(parseWatchlist('')).toEqual([])
    expect(parseWatchlist('not json')).toEqual([])
    expect(parseWatchlist('{"a":1}')).toEqual([])
  })

  it('drops non-string/empty members and dedupes', () => {
    expect(parseWatchlist('["a",1,null,"","a","b"]')).toEqual(['a', 'b'])
  })
})

describe('toggleWatchlistId', () => {
  it('adds when absent, removes when present, without mutating the input', () => {
    const ids = ['a']
    expect(toggleWatchlistId(ids, 'b')).toEqual(['a', 'b'])
    expect(toggleWatchlistId(ids, 'a')).toEqual([])
    expect(ids).toEqual(['a'])
  })
})
