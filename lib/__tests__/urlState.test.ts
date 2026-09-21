// @vitest-environment jsdom
// lib/urlState.ts — the shareable-view URL contract: setParams PATCHES the query (string sets,
// null/'' deletes, untouched keys survive — the homepage's co-mounted tables must never clobber
// each other), URLs are rebuilt from location.pathname (basePath-safe), replaceState only fires
// when the URL actually changes, and defaults are elided by callers passing null.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readParam, readParamAll, readParams, setParams } from '@/lib/urlState'

// The site lives under next.config.ts's basePath — every test URL carries it, and every
// assertion checks it survived (never a hardcoded path in the helper).
const PATH = '/productarena/'

function setUrl(search: string, hash = '') {
  window.history.replaceState(null, '', `${PATH}${search}${hash}`)
}

const url = () => `${window.location.pathname}${window.location.search}${window.location.hash}`

describe('readParams / readParam / readParamAll', () => {
  beforeEach(() => setUrl(''))

  it('reads the current query', () => {
    setUrl('?rank=initScore&arena=payments')
    expect(readParam('rank')).toBe('initScore')
    expect(readParam('arena')).toBe('payments')
    expect(readParams().get('rank')).toBe('initScore')
  })

  it('absent params read as null / []', () => {
    expect(readParam('rank')).toBeNull()
    expect(readParamAll('via')).toEqual([])
  })

  it('readParamAll collects every value of a repeated param', () => {
    setUrl('?via=a:b&via=c:d')
    expect(readParamAll('via')).toEqual(['a:b', 'c:d'])
  })
})

describe('setParams patch semantics', () => {
  beforeEach(() => setUrl(''))
  afterEach(() => vi.restoreAllMocks())

  it('sets a param and preserves the basePath pathname', () => {
    setParams({ rank: 'initScore' })
    expect(url()).toBe(`${PATH}?rank=initScore`)
  })

  it('patches: untouched keys survive (co-mounted components compose)', () => {
    setUrl('?view=processes&order=risk')
    setParams({ rank: 'popularity' })
    const p = readParams()
    expect(p.get('view')).toBe('processes')
    expect(p.get('order')).toBe('risk')
    expect(p.get('rank')).toBe('popularity')
  })

  it('null deletes the key (default elision: a cleared control leaves a clean URL)', () => {
    setUrl('?rank=initScore&q=stripe')
    setParams({ rank: null })
    expect(readParam('rank')).toBeNull()
    expect(readParam('q')).toBe('stripe')
    setParams({ q: null })
    expect(url()).toBe(PATH) // last param gone — no dangling '?'
  })

  it('empty string deletes like null (a cleared text filter removes its param)', () => {
    setUrl('?q=stripe')
    setParams({ q: '' })
    expect(url()).toBe(PATH)
  })

  it('one patch can set and delete together', () => {
    setUrl('?rank=name&dir=desc')
    setParams({ rank: 'popularity', dir: null })
    expect(url()).toBe(`${PATH}?rank=popularity`)
  })

  it('preserves the hash', () => {
    setUrl('?rank=name', '#steps')
    setParams({ rank: 'popularity' })
    expect(window.location.hash).toBe('#steps')
    expect(readParam('rank')).toBe('popularity')
  })

  it('no-ops (no replaceState call) when nothing changes', () => {
    setUrl('?rank=name')
    const spy = vi.spyOn(window.history, 'replaceState')
    setParams({ rank: 'name', dir: null })
    expect(spy).not.toHaveBeenCalled()
  })

  it('encodes values that need it (phase names with spaces)', () => {
    setParams({ phase: 'Early growth' })
    expect(readParam('phase')).toBe('Early growth')
  })
})
