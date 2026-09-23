#!/bin/bash
set -uo pipefail
cd "$(dirname "$0")/.."
LOG=".pa-tmp/postmerge-gen.log"
: > "$LOG"
run() { echo "=== $* ===" >> "$LOG"; "$@" >> "$LOG" 2>&1; local rc=$?; echo "=== exit $rc ===" >> "$LOG"; return $rc; }
run pnpm exec tsx pipeline/scripts/map-step-stories.ts || exit 30
run pnpm exec tsx pipeline/scripts/audit-human-steps.ts || exit 31
run pnpm exec tsx pipeline/scripts/map-step-calls.ts || exit 32
run pnpm exec tsx pipeline/scripts/map-step-prompts.ts || exit 33
run pnpm exec tsx pipeline/scripts/generate-story-graph.ts || exit 34
run pnpm exec tsx pipeline/scripts/tag-story-scopes.ts || exit 35
run node scripts/generate-mcp-allowlist.mjs || exit 36
echo "POSTMERGE GENERATORS OK" >> "$LOG"
exit 0
