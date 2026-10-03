// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { findSharedRecord, readSharedCatalog, sharedPreviewHref } from '../shared-processes/reader'
import { validateCatalog } from '../shared-processes/schema'
import SharedProcessReader from '@/components/shared-processes/SharedProcessReader'

function mount(markup: string) {
  const el = document.createElement('div')
  el.innerHTML = markup
  return el
}

const examples = () => validateCatalog(JSON.parse(readFileSync('content/processes/examples/staging.json', 'utf8')))

describe('canonical shared process reader', () => {
  it('reads and renders edits exclusively from shared source without needing a legacy corpus', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'shared-reader-'))
    try {
      const directory = path.join(root, 'content/processes/records')
      mkdirSync(directory, { recursive: true })
      const source = examples()
      for (const record of source) writeFileSync(path.join(directory, `${record.id}.json`), JSON.stringify(record))
      source[0].title = 'New canonical title'
      source[0].summary = 'New canonical description'
      source[0].parts[1].title = 'New canonical part'
      source[0].aliases = ['preview-alias']
      writeFileSync(path.join(directory, `${source[0].id}.json`), JSON.stringify(source[0]))
      const records = readSharedCatalog(root)
      const record = findSharedRecord(records, 'preview-alias')!
      const el = mount(renderToStaticMarkup(<SharedProcessReader record={record} records={records} />))
      expect(el.querySelector('h1')?.textContent).toBe('New canonical title')
      expect(el.textContent).toContain('New canonical description')
      expect(el.textContent).toContain('New canonical part')
      expect(findSharedRecord(records, 'unknown')).toBeUndefined()
    } finally { rmSync(root, { recursive: true, force: true }) }
  })

  it('preserves conditional branches, rejoin links, outcomes and linked process identity', () => {
    const records = examples()
    records[0].links[0].when = 'Only for the selected example'
    const el = mount(renderToStaticMarkup(<SharedProcessReader record={records[0]} records={records} />))
    expect(el.textContent).toContain('Prepare it yourself')
    expect(records[0].links[0].when).toBe('Only for the selected example')
    expect(el.textContent).toContain(records[0].outcomes[0])
    expect(el.querySelector(`a[href="${sharedPreviewHref(records[1].id, records)}"]`)).not.toBeNull()
    const links = [...el.querySelectorAll('a[href^="#"]')]
    expect(links).toHaveLength(0) // graph edges remain data, not a reader accordion
    for (const link of links) expect([...el.querySelectorAll('[id]')].some(e => `#${e.id}` === link.getAttribute('href'))).toBe(true)
  })

  it('preserves C-Corp decisions and disconnected jurisdiction parts without inventing edges', () => {
    const records = readSharedCatalog()
    const record = findSharedRecord(records, 'form_001')!
    const el = mount(renderToStaticMarkup(<SharedProcessReader record={record} records={records} />))
    expect(el.querySelectorAll('article')).toHaveLength(12) // only the selected default geographic option is rendered
    expect(el.textContent).toContain('India - MCA SPICe+ filing')
    expect(el.textContent).toContain('Jurisdictions: CA')
    expect(el.textContent).not.toContain('Jurisdictions: MULTI')
    expect(el.querySelectorAll('a[href^="#"]')).toHaveLength(0)
    expect(record.links).toHaveLength(9) // source edges are unchanged
    expect(el.textContent).not.toContain('No connections specified.') // no empty graph chrome
    expect(el.textContent).not.toContain('runs in parallel')
  })

  it('shows only explicit high-risk annotations at their own part or option scope', () => {
    const records = readSharedCatalog()
    const record = findSharedRecord(records, 'form_001')!
    const el = mount(renderToStaticMarkup(<SharedProcessReader record={record} records={records} />))
    const risks = el.querySelectorAll('[title="Existing source risk assessment"]')
    expect(risks).toHaveLength(6)
    expect([...risks].every(risk => risk.textContent === 'High risk')).toBe(true)
    const filing = el.querySelector('[id="form_001:n4"]')!
    expect(filing.querySelector(':scope > div:first-child [title="Existing source risk assessment"]')).toBeNull()
    expect(filing.querySelector('[id="form_001:n4:default"] [title="Existing source risk assessment"]')).not.toBeNull()
    const synthetic = structuredClone(record)
    synthetic.parts = [{ ...synthetic.parts[0], metadata: { reversibility: 'irreversible', riskLevel: 'medium' } }]
    synthetic.links = []
    expect(mount(renderToStaticMarkup(<SharedProcessReader record={synthetic} records={records} />)).textContent).not.toContain('High risk')
  })

  it('shows source route categories without inheriting defaults into alternatives', () => {
    const records = readSharedCatalog()
    const record = findSharedRecord(records, 'form_001')!
    const el = mount(renderToStaticMarkup(<SharedProcessReader record={record} records={records} />))
    expect(el.querySelector('[id="form_001:n3"] [title="Legacy agent classification; no verified API or tool binding"]')?.textContent).toBe('Agent · unverified')
    expect(el.querySelector('[id="form_001:n1"] [title="Existing source route assessment"]')?.textContent).toBe('Human or computer use')
    expect(el.querySelector('[id="form_001:n7b"] [title="Existing source route assessment"]')?.textContent).toBe('Signature — legally human')
    const filing = el.querySelector('[id="form_001:n4"]')!
    expect(filing.querySelector(':scope > div:first-child [title="Existing source route assessment"]')).toBeNull()
    expect(filing.querySelector('[id="form_001:n4:default"]')?.textContent).toContain('Manual form')
    expect(filing.querySelector('[id="form_001:n4:india-spice-plus"]')).toBeNull()
    expect(filing.querySelector('[id="form_001:n4:germany-notary-gmbh"]')).toBeNull()
  })

  it('exposes named links and progressively discloses detail without inventing source content', () => {
    const records = readSharedCatalog()
    const record = findSharedRecord(records, 'form_001')!
    const el = mount(renderToStaticMarkup(<SharedProcessReader record={record} records={records} />))
    const name = el.querySelector('[id="form_001:n3"]')!
    const link = name.querySelector('a')!
    expect(link.textContent).toBe('Delaware name search')
    expect(link.getAttribute('href')).toBe('https://icis.corp.delaware.gov/ecorp/entitysearch/namesearch.aspx')
    expect(link.closest('details')).toBeNull()
    expect(name.textContent).not.toContain('GET /api')
    expect(el.textContent).not.toContain('References (')
    expect(el.textContent).not.toContain('Source details')
    expect(record.parts.find(part => part.id === 'n6')?.references).toContainEqual({ kind: 'vendor', id: 'clerky', role: 'stated-vendor' })
    for (const partId of ['n5', 'n6']) {
      const part = record.parts.find(part => part.id === partId)!
      const article = el.querySelector(`[id="form_001:${partId}"]`)!
      expect(article.textContent).toContain(part.guidance)
      expect([...article.querySelectorAll('[aria-label="Related links"] a')].map(link => link.getAttribute('href')))
        .toEqual(part.references.filter(ref => ref.kind === 'url').map(ref => ref.url))
    }
    const associationsOnly = structuredClone(record)
    associationsOnly.parts = [{ ...record.parts.find(part => part.id === 'n5')!, guidance: null,
      references: [{ kind: 'vendor', id: 'clerky', role: 'stated-vendor' }] }]
    associationsOnly.links = []
    const withoutAuthoredContent = mount(renderToStaticMarkup(<SharedProcessReader record={associationsOnly} records={[associationsOnly]} />))
    expect(withoutAuthoredContent.querySelector('article details')).toBeNull()
    expect(withoutAuthoredContent.querySelector('article [aria-label="Related links"]')).toBeNull()
    const synthetic = structuredClone(record)
    synthetic.parts = [{ ...synthetic.parts[0], kind: 'step', options: [], guidance: 'Detailed authored guidance. '.repeat(20), references: [], notes: [{ text: 'Authored qualification' }] }]
    synthetic.links = []
    const long = mount(renderToStaticMarkup(<SharedProcessReader record={synthetic} records={[synthetic]} />))
    expect([...long.querySelectorAll('article summary')].map(x => x.textContent)).toEqual(['Guidance', 'Notes (1)'])
    expect(long.textContent).toContain(synthetic.parts[0].guidance)
    expect(long.textContent).toContain('Authored qualification')
  })

  it('renders the whole real catalog including the wave-3 situations (sit_013–sit_022)', () => {
    const records = readSharedCatalog()
    expect(records).toHaveLength(172)
    expect(findSharedRecord(records, 'sit_013')?.title).toBe('Recover from a payment-processor account termination')
    expect(findSharedRecord(records, 'fund_007')?.title).toBe('Apply to Y Combinator')
    for (const record of records) {
      const el = mount(renderToStaticMarkup(<SharedProcessReader record={record} records={records} />))
      expect(el.querySelector('h1')?.textContent?.startsWith(record.title)).toBe(true)
      const ids = [...el.querySelectorAll('[id]')].map(element => element.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
    const chain = findSharedRecord(records, 'first-hire')!
    const el = mount(renderToStaticMarkup(<SharedProcessReader record={chain} records={records} />))
    expect(el.querySelectorAll('a[href^="#"]')).toHaveLength(0)
    expect(el.querySelectorAll('article a[href^="/processes/preview/"]')).toHaveLength(4)
  })
})
