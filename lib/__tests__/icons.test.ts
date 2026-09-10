import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  humanizeTheme,
  metricIcon,
  metricTooltip,
  THEME_FALLBACK_ICON,
  themeIcon,
  themeTooltip,
} from '../icons'

// Every theme id actually judged in data/*/stories.json — the live taxonomy the icon rules
// must cover. Read directly (not via loadAll) so a data-validation failure elsewhere can't
// mask an icon gap.
function liveThemes(): string[] {
  const dataDir = path.join(process.cwd(), 'data')
  const themes = new Set<string>()
  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = path.join(dataDir, entry.name, 'stories.json')
    if (!fs.existsSync(file)) continue
    for (const story of JSON.parse(fs.readFileSync(file, 'utf8')) as Array<{ theme: string }>) {
      themes.add(story.theme)
    }
  }
  return [...themes]
}

describe('themeIcon', () => {
  it('covers every live theme (no fallback) — extend THEME_RULES when adding a theme', () => {
    const themes = liveThemes()
    expect(themes.length).toBeGreaterThan(100)
    const missing = themes.filter((t) => themeIcon(t) === THEME_FALLBACK_ICON)
    expect(missing).toEqual([])
  })

  it('keeps one icon per concept, matching the metric icons', () => {
    expect(themeIcon('privacy-posture')).toBe(metricIcon('privacy'))
    expect(themeIcon('openness')).toBe(metricIcon('openness'))
    expect(themeIcon('automation-depth')).toBe(metricIcon('automation'))
    expect(themeIcon('agent-access')).toBe(metricIcon('agentReady'))
    expect(themeIcon('api-quality')).toBe(metricIcon('apiQuality'))
  })

  it('falls back honestly for an unknown theme', () => {
    expect(themeIcon('zzz-not-a-real-theme-zzz')).toBe(THEME_FALLBACK_ICON)
  })
})

describe('themeTooltip', () => {
  it('always names the humanized concept, never the kebab id', () => {
    expect(themeTooltip('privacy-posture')).toBe('Privacy posture — data-handling and privacy stories')
    expect(themeTooltip('privacy-posture')).not.toContain('privacy-posture')
    // Generic themes still get an honest tooltip.
    expect(themeTooltip('billing-invoicing')).toContain('Billing invoicing — ')
  })
})

describe('metricIcon / metricTooltip', () => {
  it('has an icon and tooltip for every comparison metric', () => {
    const metrics = [
      'paScore',
      'agentReady',
      'aiNative',
      'apiQuality',
      'openness',
      'automation',
      'privacy',
      'popularity',
      'confidence',
      'access',
      'coverage',
    ]
    for (const m of metrics) {
      expect(metricIcon(m), m).not.toBe('')
      expect(metricTooltip(m), m).not.toBe('')
    }
  })

  it('resolves field-name aliases to the same concept', () => {
    expect(metricIcon('aiEra')).toBe(metricIcon('paScore'))
    expect(metricIcon('agenticApp')).toBe(metricIcon('aiNative'))
    expect(metricIcon('stars')).toBe(metricIcon('popularity'))
    expect(metricIcon('openSource')).toBe(metricIcon('openness'))
  })

  it('returns empty strings for unknown metrics (render nothing, not a wrong icon)', () => {
    expect(metricIcon('nope')).toBe('')
    expect(metricTooltip('nope')).toBe('')
  })
})

describe('humanizeTheme', () => {
  it('replaces dashes with spaces and capitalizes the first word only', () => {
    expect(humanizeTheme('privacy-posture')).toBe('Privacy posture')
    expect(humanizeTheme('agent-access')).toBe('Agent access')
    expect(humanizeTheme('openness')).toBe('Openness')
    expect(humanizeTheme('ai-in-notes')).toBe('Ai in notes')
  })
})
