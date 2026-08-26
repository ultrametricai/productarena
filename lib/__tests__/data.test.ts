import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { battleSlug, loadData, parseBattleSlug } from '@/lib/data'

const REAL = path.resolve(__dirname, '../../data')
let tmp: string | undefined
afterEach(() => { if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); tmp = undefined })

function corruptedCopy(mutate: (dir: string) => void): string {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-data-'))
  fs.cpSync(REAL, tmp, { recursive: true })
  mutate(tmp)
  return tmp
}

describe('loadData', () => {
  it('loads the committed dataset', () => {
    const data = loadData(REAL)
    expect(data.products).toHaveLength(4)
    expect(data.verdicts).toHaveLength(data.products.length * data.stories.length)
  })

  it('rejects a verdict citing missing evidence', () => {
    const dir = corruptedCopy((d) => {
      const verdicts = JSON.parse(fs.readFileSync(path.join(d, 'verdicts.json'), 'utf8'))
      verdicts[0].evidenceIds = ['ghost-ev-99']
      fs.writeFileSync(path.join(d, 'verdicts.json'), JSON.stringify(verdicts))
    })
    expect(() => loadData(dir)).toThrow(/ghost-ev-99/)
  })

  it('rejects an incomplete matrix', () => {
    const dir = corruptedCopy((d) => {
      const verdicts = JSON.parse(fs.readFileSync(path.join(d, 'verdicts.json'), 'utf8'))
      fs.writeFileSync(path.join(d, 'verdicts.json'), JSON.stringify(verdicts.slice(1)))
    })
    expect(() => loadData(dir)).toThrow(/missing verdict/)
  })
})

describe('battle slugs', () => {
  it('round-trips', () => {
    const products = loadData(REAL).products
    expect(battleSlug('macos', 'omarchy')).toBe('macos-vs-omarchy')
    expect(parseBattleSlug('macos-vs-omarchy', products)).toEqual({ a: 'macos', b: 'omarchy' })
    expect(parseBattleSlug('nope-vs-omarchy', products)).toBeNull()
  })
})
