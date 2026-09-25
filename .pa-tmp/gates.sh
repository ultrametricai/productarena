#!/bin/bash
set -uo pipefail
cd "$(dirname "$0")/.."
LOG=".pa-tmp/gates.log"
: > "$LOG"
run() { echo "=== $* ===" >> "$LOG"; "$@" >> "$LOG" 2>&1; local rc=$?; echo "=== exit $rc ===" >> "$LOG"; return $rc; }
run pnpm exec tsx pipeline/scripts/recompute-check.ts || exit 40
run node scripts/generate-badges.mjs || exit 41
run pnpm stats || exit 42
run pnpm exec next typegen || exit 43
run pnpm exec tsc --noEmit || exit 44
run pnpm lint || exit 47
run pnpm exec vitest run --maxWorkers=2 || exit 45
while pgrep -f "next buil[d]" > /dev/null; do sleep 60; done
run pnpm build || exit 46
echo "ALL GATES OK" >> "$LOG"
exit 0
