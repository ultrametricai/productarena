#!/bin/sh
# Reassemble verdicts.json from the harmonized judge cache, then re-derive and recompute CIs.
set -e
for c in card-issuing tax-automation banking-as-a-service marketplace-payments; do
  pnpm pipeline judge --category "$c" 2>&1 | tail -1
  pnpm pipeline derive --category "$c" 2>&1 | tail -1
  pnpm exec tsx pipeline/scripts/compute-confidence-intervals.ts --category "$c" 2>&1 | tail -1
done
echo REASSEMBLE_FOUR_DONE
