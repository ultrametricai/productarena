#!/bin/sh
# Resume the Part B wave for the products the transient LLM failure interrupted.
set -e
cd "$(dirname "$0")/.."
for p in paddle polar mollie; do
  echo "==== spike payments/$p"
  n=0
  until pnpm tsx pipeline/scripts/spike-engine.ts --process --category payments --product "$p" --budget-urls 12; do
    n=$((n+1)); if [ "$n" -ge 4 ]; then echo "giving up on $p"; exit 1; fi
    echo "retry $n for payments/$p after transient failure"; sleep 30
  done
done
echo "==== payments spike wave resume complete"
