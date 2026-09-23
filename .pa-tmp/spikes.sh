#!/bin/bash
# Sequential spike passes for one arena (never two spikes in the same arena concurrently).
set -uo pipefail
ARENA="$1"
shift
cd "$(dirname "$0")/.."
LOG=".pa-tmp/spikes-$ARENA.log"
: > "$LOG"
for p in "$@"; do
  echo "=== spike $ARENA/$p ===" >> "$LOG"
  pnpm exec tsx pipeline/scripts/spike-engine.ts --process --category "$ARENA" --product "$p" --budget-urls 20 >> "$LOG" 2>&1
  rc=$?
  echo "=== exit $rc ===" >> "$LOG"
  [ $rc -ne 0 ] && echo "SPIKE FAIL $ARENA/$p" >> "$LOG" && exit 27
done
echo "SPIKES OK for $ARENA" >> "$LOG"
exit 0
