#!/bin/sh
set -e
cd "$(dirname "$0")/.."
for p in airwallex checkout-com mollie paddle paypal polar square; do
  echo "== re-judge payments/$p (evicted cells only)"
  n=0
  until pnpm pipeline judge --category payments --product "$p" > /dev/null 2>&1; do
    n=$((n+1)); if [ "$n" -ge 4 ]; then echo "giving up on $p"; exit 1; fi
    echo "retry $n for $p"; sleep 30
  done
done
pnpm pipeline judge --category payments 2>&1 | tail -1
pnpm pipeline derive --category payments 2>&1 | tail -1
pnpm exec tsx pipeline/scripts/compute-confidence-intervals.ts --category payments 2>&1 | tail -1
echo "== dangling-cell repair complete"
