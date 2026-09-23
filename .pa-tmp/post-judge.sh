#!/bin/bash
# Wave-5 post-judge steps for one arena: na-harmonize -> judge (reassemble) -> derive ->
# intervals -> popularity -> logos -> probe-record (PA_RECORD=1) -> sequential spikes.
set -uo pipefail
ARENA="$1"
shift
PRODUCTS=("${@:-}")
cd "$(dirname "$0")/.."
LOG=".pa-tmp/post-$ARENA.log"
: > "$LOG"
run() {
  echo "=== $* ===" >> "$LOG"
  "$@" >> "$LOG" 2>&1
  local rc=$?
  echo "=== exit $rc ===" >> "$LOG"
  return $rc
}
run pnpm exec tsx pipeline/scripts/na-harmonize.ts --category "$ARENA" --write || exit 20
run pnpm pipeline judge --category "$ARENA" || run pnpm pipeline judge --category "$ARENA" || exit 21
run pnpm pipeline derive --category "$ARENA" || exit 22
run pnpm exec tsx pipeline/scripts/compute-confidence-intervals.ts --category "$ARENA" || exit 23
run pnpm pipeline popularity --category "$ARENA" || exit 24
run pnpm pipeline logos --category "$ARENA" || exit 25
echo "=== probe-record ===" >> "$LOG"
PA_RECORD=1 pnpm pipeline probe-record --category "$ARENA" >> "$LOG" 2>&1 || exit 26
for p in "${PRODUCTS[@]}"; do
  [ -z "$p" ] && continue
  run pnpm exec tsx pipeline/scripts/spike-engine.ts --process --category "$ARENA" --product "$p" --budget-urls 20 || exit 27
done
echo "POST+SPIKES OK for $ARENA" >> "$LOG"
exit 0
