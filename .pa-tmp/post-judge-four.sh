#!/bin/sh
# After all four judges finish: na-harmonize (write), re-derive verdicts via judge assemble,
# claims per product, derive rankings, confidence intervals.
set -x
for c in card-issuing tax-automation banking-as-a-service marketplace-payments; do
  pnpm exec tsx pipeline/scripts/na-harmonize.ts --category "$c" --write
done
echo NA_HARMONIZE_DONE
for p in stripe-issuing lithic marqeta highnote adyen-issuing; do
  pnpm pipeline claims --category card-issuing --product "$p" 2>&1 | tail -1
done
for p in stripe-tax avalara anrok taxjar numeral kintsugi; do
  pnpm pipeline claims --category tax-automation --product "$p" 2>&1 | tail -1
done
for p in stripe-treasury unit increase column synctera treasury-prime; do
  pnpm pipeline claims --category banking-as-a-service --product "$p" 2>&1 | tail -1
done
for p in stripe-connect adyen-for-platforms finix mangopay rainforest tilled; do
  pnpm pipeline claims --category marketplace-payments --product "$p" 2>&1 | tail -1
done
echo CLAIMS_DONE
for c in card-issuing tax-automation banking-as-a-service marketplace-payments; do
  pnpm pipeline derive --category "$c" 2>&1 | tail -1
  pnpm exec tsx pipeline/scripts/compute-confidence-intervals.ts --category "$c" 2>&1 | tail -1
done
echo POST_JUDGE_FOUR_DONE
