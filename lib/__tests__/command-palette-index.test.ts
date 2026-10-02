import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildCommandPaletteEntries, getCommandPaletteAsset } from '../command-palette-index'
import { loadAll } from '../data'
import { GET } from '@/app/search-index.json/route'

describe('complete static command palette asset', () => {
  it('keeps every populated arena/product and the existing curated entry groups', () => {
    const entries = buildCommandPaletteEntries()
    for (const data of loadAll()) {
      expect(entries).toContainEqual(expect.objectContaining({ type: 'arena', href: `/arena/${data.category.id}` }))
      for (const product of data.products) {
        expect(entries).toContainEqual(expect.objectContaining({ type: 'product', productId: product.id, href: `/arena/${data.category.id}/product/${product.id}` }))
      }
    }
    for (const href of ['/situations', '/processes', '/processes/incorporate-c-corp', '/startup-sim', '/get-started']) {
      expect(entries.some((entry) => entry.href === href)).toBe(true)
    }
    expect(new Set(entries.map((entry) => entry.type))).toEqual(new Set(['arena', 'product', 'stack', 'process', 'page']))
    expect(entries.some((entry) => entry.keywords?.length)).toBe(true)
    expect(entries.some((entry) => entry.icon?.startsWith('pi:'))).toBe(true)
  })

  it('serves exactly the builder output and keys the layout URL by its complete content', async () => {
    const asset = getCommandPaletteAsset()
    const response = GET()
    expect(await response.text()).toBe(JSON.stringify(buildCommandPaletteEntries()))
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate')
    expect(asset.url).toBe(`/search-index.json?v=${createHash('sha256').update(asset.body).digest('hex')}`)
    expect(getCommandPaletteAsset()).toBe(asset)
  })
})
