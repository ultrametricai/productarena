import fs from 'node:fs'
import path from 'node:path'
import { StorySchema } from '../../lib/schemas'
import { llmJson } from '../llm'
import { CACHE_DIR, DATA_DIR, writeJson } from '../paths'

const THEMES = [
  'install-setup', 'window-management', 'app-ecosystem', 'dev-experience',
  'customization', 'privacy-security', 'hardware-support', 'daily-workflow',
] as const

const SYSTEM = `You design a canonical user-story taxonomy for comparing products in one category.
Input: candidate user stories extracted from several competing products' own materials.
Output: 25-50 canonical stories that TOGETHER cover what all products claim, with duplicates merged and product-specific phrasing neutralized. Every story must be judgeable for ANY product in the category (never mention a product name).
Fields: id (kebab-case, stable, descriptive), persona (developer|designer|switcher|power-user), title ("As a <persona>, I can <specific capability>"), theme (one of: ${THEMES.join(', ')}), weight (3 = core daily-driver need, 2 = important, 1 = nice-to-have).
Return JSON: array of story objects.`

export async function runNormalize(): Promise<void> {
  const verdictsPath = path.join(DATA_DIR, 'verdicts.json')
  if (fs.existsSync(verdictsPath) && process.env.PA_FORCE_NORMALIZE !== '1') {
    const raw = fs.readFileSync(verdictsPath, 'utf8')
    if (!raw.includes('SAMPLE:')) {
      throw new Error(
        'normalize: real verdicts exist and would be invalidated. Re-run with PA_FORCE_NORMALIZE=1, then re-run judge for all products.',
      )
    }
  }

  const extractDir = path.join(CACHE_DIR, 'extract')
  if (!fs.existsSync(extractDir)) throw new Error('normalize: no extract caches — run extract first')
  const inputs = fs.readdirSync(extractDir).map((f) => {
    const productId = f.replace(/\.json$/, '')
    const candidates = JSON.parse(fs.readFileSync(path.join(extractDir, f), 'utf8')) as { persona: string; title: string }[]
    return `## ${productId}\n${candidates.map((c) => `- (${c.persona}) ${c.title}`).join('\n')}`
  })
  if (inputs.length < 2) throw new Error('normalize: need extracts from at least 2 products')

  const stories = await llmJson({
    schema: StorySchema.array().min(25).max(50),
    system: SYSTEM,
    prompt: `Category: Desktop OS.\n\nCandidate stories by product:\n\n${inputs.join('\n\n')}`,
    maxTokens: 8192,
  })

  const sorted = [...stories].sort((a, b) => a.theme.localeCompare(b.theme) || a.id.localeCompare(b.id))
  const ids = new Set(sorted.map((s) => s.id))
  if (ids.size !== sorted.length) throw new Error('normalize: duplicate story ids in LLM output')
  writeJson(path.join(DATA_DIR, 'stories.json'), sorted)
  console.log(`normalize: wrote ${sorted.length} canonical stories`)
}
