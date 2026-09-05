// Hand-rolled argv parsing — deliberately no commander/yargs (this CLI has two value flags and
// three booleans; a parser dependency would outweigh the code). Pure and throw-based so it's
// unit-testable: unknown flags and malformed values raise UsageError for exit code 1.
import { UsageError } from './api.js'
import type { Flags } from './commands.js'

export interface ParsedArgs {
  command: string | null
  positional: string[]
  flags: Flags & { help: boolean; list: boolean }
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags: ParsedArgs['flags'] = { json: false, oss: false, help: false, list: false }
  const positional: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('-')) {
      positional.push(arg)
      continue
    }
    const [name, inline] = arg.includes('=') ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)] : [arg, undefined]
    const value = (): string => {
      if (inline !== undefined) return inline
      const next = argv[++i]
      if (next === undefined || next.startsWith('-')) throw new UsageError(`flag ${name} needs a value`)
      return next
    }
    switch (name) {
      case '--json':
        flags.json = true
        break
      case '--oss':
        flags.oss = true
        break
      case '--list':
        flags.list = true
        break
      case '--help':
      case '-h':
        flags.help = true
        break
      case '--metric':
        flags.metric = value()
        break
      case '--limit': {
        const raw = value()
        const n = Number(raw)
        if (!Number.isFinite(n) || n < 1) throw new UsageError(`--limit needs a positive number (got "${raw}")`)
        flags.limit = n
        break
      }
      default:
        throw new UsageError(`unknown flag ${name} — see productarena --help`)
    }
  }

  const [command = null, ...rest] = positional
  return { command, positional: rest, flags }
}
