#!/bin/sh
# Guarded depth-spike for one product: community collect (restore pack if it
# shrank), then spike-engine --process with a 20-URL budget.
# Usage: run-spike.sh <arena> <productId>
set -u
ARENA="$1"
PID="$2"
ROOT="/Users/judegomila/Documents/GitHub/productarena/.claude/worktrees/agent-a2eab17d249881fc4"
cd "$ROOT" || exit 1
EV="data/$ARENA/evidence/$PID.json"
SNAP="/tmp/pa-guard-$ARENA-$PID.json"
cp "$EV" "$SNAP"

pnpm tsx pipeline/cli.ts collect-community --category "$ARENA" --product "$PID" 2>&1 | grep collect-community | tail -1

OLD=$(python3 -c "import json;print(sum(1 for e in json.load(open('$SNAP')) if e['tier']=='community'))")
NEW=$(python3 -c "import json;print(sum(1 for e in json.load(open('$EV')) if e['tier']=='community'))")
echo "community: old=$OLD new=$NEW"
if [ "$NEW" -lt "$OLD" ]; then
  echo "community pack shrank ($OLD -> $NEW); restoring snapshot"
  cp "$SNAP" "$EV"
fi

pnpm tsx pipeline/scripts/spike-engine.ts --process --category "$ARENA" --product "$PID" --budget-urls 20 2>&1 | grep -E "spike-engine: $ARENA|REVERT" | tail -12
