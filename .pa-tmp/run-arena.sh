#!/bin/bash
# Wave-5 arena bring-up driver: crawl -> extract x2 -> collect-community -> probe -> judge.
# One arena at a time (gate hygiene: exit codes only; judge JSON failures retry inside llm.ts).
set -uo pipefail
ARENA="$1"
cd "$(dirname "$0")/.."
LOG=".pa-tmp/run-$ARENA.log"
: > "$LOG"
run() {
  echo "=== $* ===" >> "$LOG"
  "$@" >> "$LOG" 2>&1
  local rc=$?
  echo "=== exit $rc ===" >> "$LOG"
  return $rc
}
run pnpm pipeline crawl --category "$ARENA" || exit 10
run pnpm pipeline extract --category "$ARENA" || exit 11
run pnpm pipeline extract --category "$ARENA" || exit 12
run pnpm pipeline collect-community --category "$ARENA" || exit 13
run pnpm pipeline probe --category "$ARENA" || exit 14
run pnpm pipeline judge --category "$ARENA"
rc=$?
if [ $rc -ne 0 ]; then
  # judge resume-from-cache: up to 3 retries on transient JSON failures
  for i in 1 2 3; do
    run pnpm pipeline judge --category "$ARENA" && rc=0 && break
    rc=$?
  done
fi
[ $rc -ne 0 ] && exit 15
echo "ALL STAGES OK for $ARENA" >> "$LOG"
exit 0
