import { describe, expect, it } from 'vitest'
import { stripPersonaPrefix } from '@/lib/data'

describe('stripPersonaPrefix', () => {
  it('strips "As a {persona}, I can " and capitalizes the remainder', () => {
    expect(stripPersonaPrefix('As a developer, I can run a coding agent locally from my terminal')).toBe(
      'Run a coding agent locally from my terminal',
    )
  })

  it('strips "As an {persona}, I can " (an, not a)', () => {
    expect(stripPersonaPrefix('As an AI-native user, I can point an agent at llms.txt')).toBe(
      'Point an agent at llms.txt',
    )
  })

  it('handles hyphenated persona descriptions', () => {
    expect(stripPersonaPrefix('As an engineering-lead, I can manage multiple agent-driven coding sessions')).toBe(
      'Manage multiple agent-driven coding sessions',
    )
  })

  it('strips the "…, I know " variant used by depth-mined pricing/limits stories', () => {
    expect(stripPersonaPrefix('As a devops-lead, I know the exact overage fee schedule before I get billed')).toBe(
      'The exact overage fee schedule before I get billed',
    )
  })

  it('returns the title unchanged when it does not match the expected shape', () => {
    expect(stripPersonaPrefix('A hand-edited title with no persona prefix')).toBe(
      'A hand-edited title with no persona prefix',
    )
  })

  it('never mutates the original string reference behavior (pure function)', () => {
    const title = 'As a developer, I can do a thing'
    const result = stripPersonaPrefix(title)
    expect(title).toBe('As a developer, I can do a thing')
    expect(result).toBe('Do a thing')
  })
})
