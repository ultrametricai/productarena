#!/usr/bin/env node
// productarena — pick good vendors without leaving the terminal.
// Dispatch + exit-code policy only; all real logic lives in api.ts/commands.ts (fetch+render)
// and the pure modules (args.ts, aliases.ts, pick.ts, format.ts, metrics.ts).
import pc from 'picocolors'
import { UsageError } from './api.js'
import { parseArgs } from './args.js'
import { NetworkError, createClient, resolveBaseUrl } from './client.js'
import {
  cmdArenas,
  cmdCompare,
  cmdPick,
  cmdPickList,
  cmdProduct,
  cmdRankings,
  cmdScan,
  cmdStacks,
  cmdTop,
  type Ctx,
} from './commands.js'

const HELP = `productarena — pick good vendors without leaving the terminal

Evidence-graded product rankings, live from ultrametric.ai/productarena.

Usage
  productarena <command> [args] [--json]

Commands
  arenas                                 list every arena
                                           $ productarena arenas
  rankings <arena>                       one arena's leaderboard
                                           $ productarena rankings ai-coding
  product <arena> <id>                   one product's scorecard, access, and links
                                           $ productarena product payments stripe
  compare <id> <id> [...]                cross-arena comparison (max 6, ids are global)
                                           $ productarena compare stripe adyen
  top [--metric M] [--oss] [--limit N]   cross-arena best by one metric
                                           $ productarena top --metric agentReady --oss
  pick <role> [--metric M] [--oss]       THE vendor pick for a role (pick --list for roles)
                                           $ productarena pick payroll
  stacks [id]                            curated AI stacks, slots resolved live
                                           $ productarena stacks
  scan <url>                             agent-readiness quick scan of any product site
                                           $ productarena scan https://stripe.com

Flags
  --json      machine-readable output (stable shapes — built for scripts and agents)
  --metric M  agentReady (default) | arenaScore | agenticApp | apiQuality | score
  --oss       open-source products only (top, pick)
  --limit N   rows for top (default 10, max 50)
  -h, --help  this help

Data is fetched live with a 5-minute cache; PA_BASE_URL overrides the site.
Exit codes: 0 ok · 1 usage error · 2 network error.`

async function main(): Promise<void> {
  const { command, positional, flags } = parseArgs(process.argv.slice(2))

  if (flags.help || command === null || command === 'help') {
    console.log(HELP)
    return
  }

  const color = pc.isColorSupported && !flags.json
  const ctx: Ctx = {
    client: createClient(resolveBaseUrl()),
    color,
    out: (line = '') => console.log(line),
  }

  const need = (n: number, usage: string): void => {
    if (positional.length < n) throw new UsageError(`usage: productarena ${usage}`)
  }

  switch (command) {
    case 'arenas':
      return cmdArenas(ctx, flags)
    case 'rankings':
      need(1, 'rankings <arena>')
      return cmdRankings(ctx, positional[0], flags)
    case 'product':
      need(2, 'product <arena> <id>')
      return cmdProduct(ctx, positional[0], positional[1], flags)
    case 'compare':
      need(2, 'compare <id> <id> [...]')
      return cmdCompare(ctx, positional, flags)
    case 'top':
      return cmdTop(ctx, flags)
    case 'pick':
      if (flags.list) return cmdPickList(ctx, flags)
      need(1, 'pick <role> [--metric M] [--oss]  (or pick --list)')
      return cmdPick(ctx, positional[0], flags)
    case 'stacks':
      return cmdStacks(ctx, positional[0], flags)
    case 'scan':
      need(1, 'scan <url>')
      return cmdScan(ctx, positional[0], flags)
    default:
      throw new UsageError(`unknown command "${command}" — see productarena --help`)
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(pc.isColorSupported ? pc.red(`error: ${message}`) : `error: ${message}`)
  process.exitCode = err instanceof NetworkError ? 2 : 1
})
