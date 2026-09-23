#!/bin/bash
# Launch-day generator re-runs after the cloud-storage / cloud-platforms wiring:
# map-step-stories -> audit-human-steps -> map-step-calls -> map-step-prompts (touched tasks)
# -> generate-story-graph -> tag-story-scopes -> mcp allowlist. Exit codes only.
set -uo pipefail
cd "$(dirname "$0")/.."
LOG=".pa-tmp/generators.log"
: > "$LOG"
run() {
  echo "=== $* ===" >> "$LOG"
  "$@" >> "$LOG" 2>&1
  local rc=$?
  echo "=== exit $rc ===" >> "$LOG"
  return $rc
}
run pnpm exec tsx pipeline/scripts/map-step-stories.ts || exit 30
run pnpm exec tsx pipeline/scripts/audit-human-steps.ts || exit 31
run pnpm exec tsx pipeline/scripts/map-step-calls.ts || exit 32
for t in qs_015 fund_005 fund_002 comp_011 shutdown_001 prod_001; do
  run pnpm exec tsx pipeline/scripts/map-step-prompts.ts --task "$t" || exit 33
done
run pnpm exec tsx pipeline/scripts/generate-story-graph.ts || exit 34
run pnpm exec tsx pipeline/scripts/tag-story-scopes.ts || exit 35
run node scripts/generate-mcp-allowlist.mjs || exit 36
echo "GENERATORS OK" >> "$LOG"
exit 0
