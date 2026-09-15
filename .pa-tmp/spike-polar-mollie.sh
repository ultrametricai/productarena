#!/bin/sh
set -e
cd "$(dirname "$0")/.."
for p in polar mollie; do
  echo "==== spike payments/$p"
  n=0
  until pnpm tsx pipeline/scripts/spike-engine.ts --process --category payments --product "$p" --budget-urls 12 >> .pa-tmp/spike-$p.log 2>&1; do
    n=$((n+1)); if [ "$n" -ge 4 ]; then echo "giving up on $p"; exit 1; fi
    echo "retry $n for payments/$p"; sleep 30
  done
  tail -2 .pa-tmp/spike-$p.log
done
echo "==== polar+mollie complete"
