import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isPopulated, loadCategory } from '@/lib/data'
import { classifyGapStep } from '@/lib/gapClosers'
import { chainTasks, loadChains, loadProcesses, STEP_OPTIONS_CAP } from '@/lib/processes'
import {
  COMPUTER_USE_SOURCES, computerUseEligibleProducts, computerUseMappingsFor, computerUseOptions,
  coveringArenaId, crossArenaStepRankings, extraArenasFor, extraMappingsFor, functionMappingFor,
  loadStepStoryMap, processLeaderboard, stepRanking, temporarilyHumanSteps,
} from '@/lib/processRankings'
import { VERDICT_FACTORS } from '@/lib/scoring'

const DATA_DIR = path.resolve(__dirname, '../../data')

const tasks = () => loadProcesses(DATA_DIR)

describe('committed step→story mapping (data/process-step-stories.json)', () => {
  it('exists — the rankings feature ships with its mapping', () => {
    expect(fs.existsSync(path.join(DATA_DIR, 'process-step-stories.json'))).toBe(true)
    expect(loadStepStoryMap(DATA_DIR).length).toBeGreaterThan(0)
  })

  it('every entry targets a real (task, node), a populated arena, and REAL story ids of that arena', () => {
    const nodeByKey = new Map(
      tasks().flatMap((t) => t.dag.nodes.map((n) => [`${t.id}:${n.id}`, { task: t, node: n }] as const)),
    )
    const storyIdsOf = new Map<string, Set<string>>()
    for (const e of loadStepStoryMap(DATA_DIR)) {
      const hit = nodeByKey.get(`${e.taskId}:${e.nodeId}`)
      expect(hit, `mapping targets unknown step ${e.taskId}:${e.nodeId}`).toBeDefined()
      expect(isPopulated(e.arenaId, DATA_DIR), `mapping targets unpopulated arena ${e.arenaId}`).toBe(true)
      if (!storyIdsOf.has(e.arenaId)) {
        storyIdsOf.set(e.arenaId, new Set(loadCategory(e.arenaId, DATA_DIR).stories.map((s) => s.id)))
      }
      const known = storyIdsOf.get(e.arenaId)!
      for (const sid of e.storyIds) {
        expect(known.has(sid), `mapping ${e.taskId}:${e.nodeId} cites unknown story ${e.arenaId}/${sid}`).toBe(true)
      }
      expect(new Set(e.storyIds).size, `duplicate storyIds in ${e.taskId}:${e.nodeId}`).toBe(e.storyIds.length)
      expect(e.storyIds.length, `mapping ${e.taskId}:${e.nodeId} exceeds the per-step cap`).toBeLessThanOrEqual(8)
    }
  })

  it('kinds are honest: function entries match the step\'s covering arena; extra entries only for declared extra arenas; computer-use entries only for temporarily-human steps, only from fleet sources', () => {
    const nodeByKey = new Map(
      tasks().flatMap((t) => t.dag.nodes.map((n) => [`${t.id}:${n.id}`, n] as const)),
    )
    const sourceByArena = new Map(COMPUTER_USE_SOURCES.map((s) => [s.arenaId, s]))
    const seen = new Set<string>()
    for (const e of loadStepStoryMap(DATA_DIR)) {
      const key = `${e.taskId}:${e.nodeId}:${e.kind}:${e.arenaId}`
      expect(seen.has(key), `duplicate mapping ${key}`).toBe(false)
      seen.add(key)
      const node = nodeByKey.get(`${e.taskId}:${e.nodeId}`)!
      if (e.kind === 'function') {
        expect(e.arenaId, `function mapping ${e.taskId}:${e.nodeId} disagrees with the covering arena`)
          .toBe(coveringArenaId(node))
      } else if (e.kind === 'extra') {
        expect(extraArenasFor(node), `extra mapping ${e.taskId}:${e.nodeId} targets undeclared arena ${e.arenaId}`)
          .toContain(e.arenaId)
      } else {
        const cls = classifyGapStep({ label: node.label, route: node.route, async: node.async })
        expect(cls?.kind, `computer-use mapping on non-irreducible step ${e.taskId}:${e.nodeId}`).toBe('irreducible')
        const source = sourceByArena.get(e.arenaId)
        expect(source, `computer-use mapping from non-fleet arena ${e.arenaId}`).toBeDefined()
        // Assistants may only be mapped onto their judged computer-use stories — never onto
        // generic assistant capabilities.
        if (source!.storyIds !== null) {
          for (const sid of e.storyIds) expect(source!.storyIds).toContain(sid)
        }
      }
    }
  })

  it('is complete: every step with a populated covering arena has a function mapping; every declared extra arena has an extra mapping; every temporarily-human step has its computer-use mappings', () => {
    for (const task of tasks()) {
      for (const node of task.dag.nodes) {
        const arenaId = coveringArenaId(node)
        if (arenaId && isPopulated(arenaId, DATA_DIR)) {
          expect(functionMappingFor(task.id, node, DATA_DIR), `missing function mapping for ${task.id}:${node.id}`).not.toBeNull()
        }
        const extraArenas = extraArenasFor(node).filter((a) => isPopulated(a, DATA_DIR))
        expect(
          extraMappingsFor(task.id, node, DATA_DIR).map((e) => e.arenaId).sort(),
          `missing extra mapping(s) for ${task.id}:${node.id}`,
        ).toEqual([...extraArenas].sort())
      }
    }
    const populatedSources = COMPUTER_USE_SOURCES.filter((s) => isPopulated(s.arenaId, DATA_DIR))
    expect(populatedSources.length).toBeGreaterThan(0)
    for (const g of temporarilyHumanSteps(tasks())) {
      const mapped = computerUseMappingsFor(g.taskId, g.node.id, DATA_DIR)
      expect(mapped.length, `missing computer-use mappings for ${g.taskId}:${g.node.id}`).toBe(populatedSources.length)
    }
  })
})

describe('step scores are deterministic recomputations of the judged verdicts', () => {
  // Independent recompute of the documented formula — weight × quality × verdict factor over
  // the mapped stories, na excluded — straight from the raw data files.
  function recompute(arenaId: string, storyIds: string[], productId: string): number | null {
    const stories = JSON.parse(fs.readFileSync(path.join(DATA_DIR, arenaId, 'stories.json'), 'utf8')) as
      Array<{ id: string; weight: number }>
    const verdicts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, arenaId, 'verdicts.json'), 'utf8')) as
      Array<{ productId: string; storyId: string; verdict: keyof typeof VERDICT_FACTORS; quality: number }>
    const weightOf = new Map(stories.map((s) => [s.id, s.weight]))
    let num = 0
    let den = 0
    for (const sid of storyIds) {
      const v = verdicts.find((x) => x.productId === productId && x.storyId === sid)
      if (!v || v.verdict === 'na') continue
      const w = weightOf.get(sid)!
      num += w * v.quality * VERDICT_FACTORS[v.verdict]
      den += w * 10
    }
    if (den === 0) return null
    return Math.round((num / den) * 100 * 10) / 10
  }

  it('every ranked step score matches the from-scratch recompute (first 25 mapped steps)', () => {
    let checked = 0
    outer: for (const task of tasks()) {
      for (const node of task.dag.nodes) {
        const ranking = stepRanking(task.id, node, DATA_DIR)
        if (!ranking) continue
        for (const v of ranking.vendors) {
          expect(v.score, `${task.id}:${node.id} ${v.productId}`).toBe(
            recompute(ranking.arenaId, ranking.stories.map((s) => s.id), v.productId),
          )
          expect(v.score).toBeGreaterThanOrEqual(0)
          expect(v.score).toBeLessThanOrEqual(100)
        }
        expect(ranking.vendors.length).toBeLessThanOrEqual(STEP_OPTIONS_CAP)
        // Ranked best-first.
        for (let i = 1; i < ranking.vendors.length; i++) {
          expect(ranking.vendors[i - 1].score).toBeGreaterThanOrEqual(ranking.vendors[i].score)
        }
        checked += 1
        if (checked >= 25) break outer
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('cites behind a score reference the real verdict rows', () => {
    const task = tasks().find((t) => t.dag.nodes.some((n) => stepRanking(t.id, n, DATA_DIR)))!
    const node = task.dag.nodes.find((n) => stepRanking(task.id, n, DATA_DIR))!
    const ranking = stepRanking(task.id, node, DATA_DIR)!
    const { verdicts } = loadCategory(ranking.arenaId, DATA_DIR)
    for (const v of ranking.vendors) {
      expect(v.cites.length).toBeGreaterThan(0)
      for (const c of v.cites) {
        const real = verdicts.find((x) => x.productId === v.productId && x.storyId === c.storyId)
        expect(real, `cite ${v.productId}:${c.storyId} has no verdict row`).toBeDefined()
        expect(c.verdict).toBe(real!.verdict)
        expect(c.quality).toBe(real!.quality)
      }
    }
  })

  it('recomputing a process leaderboard twice is bit-identical (pure derivation)', () => {
    const task = tasks().find((t) => processLeaderboard(t, DATA_DIR).entries.length > 0)!
    const a = processLeaderboard(task, DATA_DIR)
    const b = processLeaderboard(task, DATA_DIR)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('process leaderboard (coverage × step scores)', () => {
  it('processScore = sum of served step scores over rankable steps; avg over served steps', () => {
    const task = tasks().find((t) => {
      const lb = processLeaderboard(t, DATA_DIR)
      return lb.entries.length > 2 && lb.rankableSteps > 1
    })!
    const lb = processLeaderboard(task, DATA_DIR)
    for (const e of lb.entries) {
      const sum = e.steps.reduce((acc, s) => acc + s.score, 0)
      expect(e.stepsServed).toBe(e.steps.length)
      expect(e.avgStepScore).toBe(Math.round((sum / e.stepsServed) * 10) / 10)
      expect(e.processScore).toBe(Math.round((sum / lb.rankableSteps) * 10) / 10)
      expect(e.processScore).toBeLessThanOrEqual(e.avgStepScore + 1e-9)
    }
    // Sorted best-first.
    for (let i = 1; i < lb.entries.length; i++) {
      expect(lb.entries[i - 1].processScore).toBeGreaterThanOrEqual(lb.entries[i].processScore)
    }
    // The best-per-step chain names each rankable step's top vendor.
    expect(lb.bestPerStep.length).toBe(lb.rankableSteps)
    for (const s of lb.bestPerStep) {
      const ranking = stepRanking(task.id, task.dag.nodes.find((n) => n.id === s.nodeId)!, DATA_DIR)!
      expect(s.top.productId).toBe(ranking.vendors[0].productId)
      expect(s.top.score).toBe(ranking.vendors[0].score)
    }
  })
})

describe('computer use for temporarily-human steps — judged evidence only', () => {
  it('every option comes from the browser-agents roster or an assistant with a judged full/partial computer-use verdict', () => {
    const eligibleByArena = new Map(
      COMPUTER_USE_SOURCES
        .filter((s) => isPopulated(s.arenaId, DATA_DIR))
        .map((s) => [s.arenaId, computerUseEligibleProducts(s, DATA_DIR)] as const),
    )
    let optionSteps = 0
    for (const g of temporarilyHumanSteps(tasks())) {
      const options = computerUseOptions(g.taskId, g.node.id, DATA_DIR)
      expect(options.length).toBeLessThanOrEqual(STEP_OPTIONS_CAP)
      if (options.length > 0) optionSteps += 1
      for (const o of options) {
        const eligible = eligibleByArena.get(o.arenaId)
        expect(eligible, `option from non-fleet arena ${o.arenaId}`).toBeDefined()
        expect(eligible!.has(o.productId), `${o.productId} has no judged computer-use evidence`).toBe(true)
        // Never a vibes entry: a positive score backed by at least one full/partial verdict.
        expect(o.score).toBeGreaterThan(0)
        expect(o.cites.some((c) => c.verdict === 'full' || c.verdict === 'partial')).toBe(true)
      }
    }
    // The feature actually surfaces options somewhere (not vacuously green).
    expect(optionSteps).toBeGreaterThan(0)
  })

  it('assistants without judged computer-use evidence are excluded from eligibility', () => {
    const assistants = COMPUTER_USE_SOURCES.find((s) => s.arenaId === 'ai-assistants')!
    const eligible = computerUseEligibleProducts(assistants, DATA_DIR)
    const { products, verdicts } = loadCategory('ai-assistants', DATA_DIR)
    for (const p of products) {
      const hasEvidence = verdicts.some(
        (v) => v.productId === p.id
          && assistants.storyIds!.includes(v.storyId)
          && (v.verdict === 'full' || v.verdict === 'partial'),
      )
      expect(eligible.has(p.id)).toBe(hasEvidence)
    }
  })
})

describe('cross-arena step options (extraOptionArenas / extraOptionRefs) — judged evidence only', () => {
  it('every cross-arena vendor is allowed by the node, scored on the committed extra mapping, and backed by a full/partial verdict', () => {
    let optionSteps = 0
    for (const task of tasks()) {
      for (const node of task.dag.nodes) {
        const rankings = crossArenaStepRankings(task.id, node, DATA_DIR)
        for (const r of rankings) {
          expect(r.kind).toBe('extra')
          expect(extraArenasFor(node)).toContain(r.arenaId)
          expect(r.arenaId).not.toBe(coveringArenaId(node))
          const wholeArena = (node.extraOptionArenas ?? []).includes(r.arenaId)
          const allowedRefs = new Set(
            (node.extraOptionRefs ?? []).filter((x) => x.arenaId === r.arenaId).map((x) => x.productId),
          )
          const mapping = extraMappingsFor(task.id, node, DATA_DIR).find((e) => e.arenaId === r.arenaId)!
          expect(mapping.storyIds.length).toBeGreaterThan(0)
          const mapped = new Set(mapping.storyIds)
          expect(r.vendors.length).toBeLessThanOrEqual(STEP_OPTIONS_CAP)
          for (const v of r.vendors) {
            if (!wholeArena) {
              expect(allowedRefs.has(v.productId), `${task.id}:${node.id}: ${v.productId} is not an allowed extra ref`).toBe(true)
            }
            // Never a vibes entry: positive score, at least one judged full/partial verdict,
            // every cite drawn from exactly the committed mapping.
            expect(v.score).toBeGreaterThan(0)
            expect(v.cites.some((c) => c.verdict === 'full' || c.verdict === 'partial')).toBe(true)
            for (const c of v.cites) expect(mapped.has(c.storyId)).toBe(true)
          }
        }
        if (rankings.length > 0) optionSteps += 1
      }
    }
    // The curation sweep actually landed: a meaningful slice of the corpus gained cross-arena vendors.
    expect(optionSteps).toBeGreaterThanOrEqual(50)
  })

  it('every committed extra ref survives the evidence gate — refs without a judged full/partial verdict must be pruned, not shipped', () => {
    for (const task of tasks()) {
      for (const node of task.dag.nodes) {
        const rankings = crossArenaStepRankings(task.id, node, DATA_DIR)
        for (const ref of node.extraOptionRefs ?? []) {
          const r = rankings.find((x) => x.arenaId === ref.arenaId)
          expect(
            r?.vendors.some((v) => v.productId === ref.productId),
            `${task.id}:${node.id}: extra ref ${ref.arenaId}/${ref.productId} has no judged full/partial evidence for this move — remove the ref (record it as an honest exclusion) or land the evidence`,
          ).toBe(true)
        }
      }
    }
  })

  it('cross-arena scores are the same weightedPercent recompute as primary step scores (first 10 rankings)', () => {
    let checked = 0
    outer: for (const task of tasks()) {
      for (const node of task.dag.nodes) {
        for (const r of crossArenaStepRankings(task.id, node, DATA_DIR)) {
          const { verdicts } = loadCategory(r.arenaId, DATA_DIR)
          for (const v of r.vendors) {
            let num = 0
            let den = 0
            for (const s of r.stories) {
              const row = verdicts.find((x) => x.productId === v.productId && x.storyId === s.id)
              if (!row || row.verdict === 'na') continue
              num += s.weight * row.quality * VERDICT_FACTORS[row.verdict]
              den += s.weight * 10
            }
            expect(v.score, `${task.id}:${node.id} ${r.arenaId}/${v.productId}`).toBe(
              Math.round((num / den) * 100 * 10) / 10,
            )
          }
          checked += 1
          if (checked >= 10) break outer
        }
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
})

describe('end-to-end: launch-website chain (founder ask: key other vendors for every move)', () => {
  it('site generation lists ChatGPT (ai-assistants) and Framer/Figma/Canva (design-tools) beside the vibe-coding roster, each evidence-backed', () => {
    const chain = loadChains(DATA_DIR).find((c) => c.id === 'launch-website')!
    const snapshot = chainTasks(chain, DATA_DIR).map((task) => ({
      task: task.id,
      steps: task.dag.nodes.map((n) => {
        const primary = stepRanking(task.id, n, DATA_DIR)
        const extras = crossArenaStepRankings(task.id, n, DATA_DIR)
        return {
          nodeId: n.id,
          label: n.label,
          primary: primary ? primary.vendors.map((v) => `${v.productId}:${v.score}`) : null,
          extras: extras.map((r) => ({
            arena: r.arenaId,
            vendors: r.vendors.map((v) => `${v.productId}:${v.score}`),
          })),
        }
      }),
    }))
    // The founder examples, asserted directly (not just snapshotted): "generate a website" is
    // served by ChatGPT and by the real design-tool site builders, with judged evidence.
    const gen = snapshot.find((t) => t.task === 'site_001')!.steps.find((s) => s.nodeId === 'n1')!
    expect(gen.extras.find((e) => e.arena === 'ai-assistants')?.vendors.some((v) => v.startsWith('chatgpt:'))).toBe(true)
    expect(gen.extras.find((e) => e.arena === 'design-tools')?.vendors.some((v) => v.startsWith('framer:'))).toBe(true)
    // Publishing is also served by the vibe-coding builders themselves (one-click publish).
    const publish = snapshot.find((t) => t.task === 'site_001')!.steps.find((s) => s.nodeId === 'n2')!
    expect(publish.extras.some((e) => e.arena === 'vibe-coding' && e.vendors.length > 0)).toBe(true)
    expect(snapshot).toMatchSnapshot()
  })

  it('poly is honestly excluded from site generation — its judged notes-knowledge stories do not evidence the move — but ships where it is evidenced', () => {
    // The founder asked for Poly on launch-website; the judged evidence says no (its
    // publish-notes-website verdict is none, and no notes-knowledge story maps to generating a
    // company site). Poly surfaces where its verdicts DO clear the gate: importing files.
    const site = tasks().find((t) => t.id === 'site_001')!
    for (const node of site.dag.nodes) {
      const vendors = crossArenaStepRankings(site.id, node, DATA_DIR).flatMap((r) => r.vendors)
      expect(vendors.some((v) => v.productId === 'poly')).toBe(false)
    }
    // The Dropbox-import opportunity folded into doc-storage setup (curation 2026-09-18) — the
    // import step carries the same Poly cross-arena ref.
    const docStorage = tasks().find((t) => t.id === 'qs_015')!
    const importStep = docStorage.dag.nodes.find((n) => n.id === 'n4')!
    const poly = crossArenaStepRankings(docStorage.id, importStep, DATA_DIR)
      .flatMap((r) => r.vendors)
      .find((v) => v.productId === 'poly')
    expect(poly).toBeDefined()
    expect(poly!.arenaId).toBe('notes-knowledge')
    expect(poly!.cites.some((c) => c.verdict === 'full' || c.verdict === 'partial')).toBe(true)
  })
})

describe('end-to-end: Incorporate C-Corp (company-launch playbook)', () => {
  it('step rankings + process leaderboard + a temporarily-human step with computer-use options', () => {
    const task = tasks().find((t) => t.id === 'form_001')!
    const lb = processLeaderboard(task, DATA_DIR)
    const snapshot = {
      task: task.id,
      rankableSteps: lb.rankableSteps,
      totalSteps: lb.totalSteps,
      leaderboard: lb.entries.map((e) => ({
        productId: e.productId,
        arenaId: e.arenaId,
        stepsServed: e.stepsServed,
        processScore: e.processScore,
      })),
      bestPerStep: lb.bestPerStep.map((s) => ({ nodeId: s.nodeId, top: s.top.productId, score: s.top.score })),
      stepRankings: task.dag.nodes.map((n) => {
        const r = stepRanking(task.id, n, DATA_DIR)
        return {
          nodeId: n.id,
          label: n.label,
          ranked: r ? r.vendors.map((v) => `${v.productId}:${v.score}`) : null,
        }
      }),
      computerUse: temporarilyHumanSteps([task]).map((g) => ({
        nodeId: g.node.id,
        label: g.node.label,
        options: computerUseOptions(g.taskId, g.node.id, DATA_DIR).map((o) => `${o.arenaId}/${o.productId}:${o.score}`),
      })),
    }
    expect(snapshot.leaderboard.length).toBeGreaterThan(0)
    expect(snapshot).toMatchSnapshot()
  })

  // form_001 has no temporarily-human steps, so the computer-use surface is snapshotted on a
  // process that does: filing the corporate tax return (CPA prepare/review/file steps).
  it('temporarily-human steps carry ranked, verdict-backed computer-use options (corporate tax return)', () => {
    const task = tasks().find((t) => t.id === 'tax_002')!
    const cu = temporarilyHumanSteps([task]).map((g) => ({
      nodeId: g.node.id,
      label: g.node.label,
      options: computerUseOptions(g.taskId, g.node.id, DATA_DIR).map((o) => `${o.arenaId}/${o.productId}:${o.score}`),
    }))
    expect(cu.some((s) => s.options.length > 0)).toBe(true)
    expect(cu).toMatchSnapshot()
  })
})
