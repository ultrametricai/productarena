import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { REPO } from './site'

// Business-logic ↔ process map (founder 2026-10-02): the committed registry
// processes/business-logic-map.json names which lib/openstartup modules serve which corpus
// processes, and process pages render the hits as a muted "Open modules" chip line linking to
// the module's section in business-logic/README.md on GitHub (repo-first — the modules are a
// library by design, no new site pages). Same SSOT posture as the vendor registry
// (lib/processes.ts): facts live in the open corpus file, this module only reads them back,
// and the honesty invariants are data-tested — every module id is a real lib/openstartup file,
// every mapped process id exists in the corpus, every anchor resolves to a real README heading
// (lib/__tests__/businessLogicMap.test.ts). Modules with no honest process target are simply
// absent from the registry; nothing is forced.

export const BusinessLogicModuleSchema = z
  .object({
    // Display name — mirrors the module's `###` heading in business-logic/README.md.
    label: z.string().min(1),
    // The module source file, repo-relative — must exist (totality-tested).
    file: z.string().regex(/^lib\/openstartup\/[A-Za-z0-9]+\.ts$/),
    // GitHub's slug for the README heading — the chip's deep-link target.
    anchor: z.string().regex(/^[a-z0-9]+(-+[a-z0-9]+)*$/),
    // Corpus task ids (processes/corpus.json) this module honestly serves.
    processes: z.string().min(1).array().min(1),
  })
  .strict()
export type BusinessLogicModule = z.infer<typeof BusinessLogicModuleSchema>

export const BusinessLogicMapSchema = z
  .object({
    $comment: z.string().optional(),
    modules: z.record(z.string().regex(/^[a-z][A-Za-z0-9]*$/), BusinessLogicModuleSchema),
  })
  .strict()

const mapFile = () => path.join(process.cwd(), 'processes', 'business-logic-map.json')
let mapCache: Record<string, BusinessLogicModule> | null = null
export function loadBusinessLogicMap(): Record<string, BusinessLogicModule> {
  if (!mapCache) {
    mapCache = BusinessLogicMapSchema.parse(JSON.parse(fs.readFileSync(mapFile(), 'utf8'))).modules
  }
  return mapCache
}

/** One rendered chip: the module's label + its README deep link on GitHub. */
export interface OpenModuleChip {
  id: string
  label: string
  href: string
}

export function moduleReadmeHref(anchor: string): string {
  return `https://github.com/${REPO}/blob/main/business-logic/README.md#${anchor}`
}

/** The open modules serving one process, in registry order ([] for the many unmapped tasks). */
export function modulesForProcess(taskId: string): OpenModuleChip[] {
  return Object.entries(loadBusinessLogicMap())
    .filter(([, m]) => m.processes.includes(taskId))
    .map(([id, m]) => ({ id, label: m.label, href: moduleReadmeHref(m.anchor) }))
}
