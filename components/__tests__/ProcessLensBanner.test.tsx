// @vitest-environment jsdom
// ProcessLensBanner + useLensUrlSync — the shareable "via vendor" URLs (founder 2026-09-21):
// ?via=<arenaId>:<productId> makes a shared process/chain URL open in the sender's exact lens
// view. The banner mounts the sync exactly once per lens page, so the semantics under test are:
//   mount:  URL lens WINS over localStorage for the pageKey and is saved to it; no ?via leaves
//           both the storage and the URL untouched (no unasked export of an old lens);
//   after:  any pick/clear on the page (writeLens from a step row, the banner's own clear)
//           mirrors the whole lens into ?via — empty lens deletes the param (clean default URL).
import { act, fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ProcessLensBanner from '@/components/ProcessLensBanner'
import {
  lensStorageKey,
  parseLensState,
  serializeLensState,
  writeLens,
} from '@/lib/processLens'
import type { ProcessCheckStep } from '@/lib/processCheck'

// Same in-memory localStorage stand-in as components/__tests__/StepVendorRow.test.tsx.
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

const PAGE_KEY = 'task-x'
const STORAGE_KEY = lensStorageKey(PAGE_KEY)
const PATH = '/productarena/processes/task-x'
const setUrl = (search: string) => window.history.replaceState(null, '', `${PATH}${search}`)
const params = () => new URLSearchParams(window.location.search)
const storedPicks = () => parseLensState(window.localStorage.getItem(STORAGE_KEY)).picks

const STEPS: ProcessCheckStep[] = [
  {
    nodeId: 'open',
    label: 'Open the account',
    storyCount: 3,
    arenas: [
      {
        arenaId: 'startup-banking',
        arenaName: 'Startup banking',
        kind: 'function',
        vendors: [
          { productId: 'best-bank', name: 'Best Bank', score: 90 },
          { productId: 'mid-bank', name: 'Mid Bank', score: 71 },
        ],
      },
    ],
    best: { productId: 'best-bank', name: 'Best Bank', score: 90, arenaId: 'startup-banking' },
  },
]

const banner = <ProcessLensBanner steps={STEPS} pageKey={PAGE_KEY} />

beforeEach(() => {
  stubLocalStorage()
  setUrl('')
})

describe('mount: URL wins over localStorage and is saved to it', () => {
  it('imports ?via into the pageKey lens storage and shows the shared view', () => {
    setUrl('?via=startup-banking:mid-bank')
    const { container } = render(banner)
    expect(storedPicks()).toEqual({ 'startup-banking': 'mid-bank' })
    expect(container.textContent).toContain('Viewing via Mid Bank')
    // The param stays — copying the URL again still shares this exact view.
    expect(params().get('via')).toBe('startup-banking:mid-bank')
  })

  it('overwrites a different stored lens (URL wins), keeping names only for still-picked ids', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      serializeLensState({ picks: { 'startup-banking': 'best-bank' }, names: { 'best-bank': 'Best Bank' } }),
    )
    setUrl('?via=startup-banking:mid-bank')
    render(banner)
    const state = parseLensState(window.localStorage.getItem(STORAGE_KEY))
    expect(state.picks).toEqual({ 'startup-banking': 'mid-bank' })
    expect(state.names).toEqual({}) // best-bank no longer picked — its click-time name pruned
  })

  it('no ?via: the stored lens stands and is NOT exported into the URL unasked', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      serializeLensState({ picks: { 'startup-banking': 'mid-bank' }, names: {} }),
    )
    const { container } = render(banner)
    expect(container.textContent).toContain('Viewing via Mid Bank')
    expect(window.location.search).toBe('') // a plain visit keeps a clean URL
  })

  it('a fully invalid ?via falls back to the default view silently', () => {
    setUrl('?via=garbage')
    const { container } = render(banner)
    expect(storedPicks()).toEqual({})
    expect(container.firstChild).toBeNull() // no lens, no stack → the banner renders nothing
  })
})

describe('after mount: every pick/clear mirrors into ?via', () => {
  it('a lens write from anywhere on the page (a step-row click) updates the param', () => {
    render(banner)
    act(() => {
      writeLens(STORAGE_KEY, { picks: { 'startup-banking': 'mid-bank' }, names: { 'mid-bank': 'Mid Bank' } })
    })
    expect(params().get('via')).toBe('startup-banking:mid-bank')
    // A second pick in another arena joins comma-separated, sorted — the multi-arena lens URL.
    act(() => {
      writeLens(STORAGE_KEY, {
        picks: { 'startup-banking': 'mid-bank', payroll: 'gusto' },
        names: { 'mid-bank': 'Mid Bank' },
      })
    })
    expect(params().get('via')).toBe('payroll:gusto,startup-banking:mid-bank')
  })

  it("the banner's clear button empties the lens AND removes ?via — back to the clean URL", () => {
    setUrl('?via=startup-banking:mid-bank')
    const { getByText } = render(banner)
    fireEvent.click(getByText('clear'))
    expect(storedPicks()).toEqual({})
    expect(params().get('via')).toBeNull()
  })

  it('patches, never rebuilds: other view params survive lens changes', () => {
    setUrl('?order=risk&via=startup-banking:best-bank')
    render(banner)
    act(() => {
      writeLens(STORAGE_KEY, { picks: {}, names: {} })
    })
    expect(params().get('via')).toBeNull()
    expect(params().get('order')).toBe('risk')
  })
})
