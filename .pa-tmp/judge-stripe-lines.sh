#!/bin/sh
# Judge the four stripe-lines arenas product-by-product (cache-resumable).
set -e
for p in stripe-issuing lithic marqeta highnote adyen-issuing; do
  pnpm pipeline judge --category card-issuing --product "$p" 2>&1 | tail -2
done
echo JUDGE_CARD_ISSUING_DONE
for p in stripe-tax avalara anrok taxjar numeral kintsugi; do
  pnpm pipeline judge --category tax-automation --product "$p" 2>&1 | tail -2
done
echo JUDGE_TAX_DONE
for p in stripe-connect adyen-for-platforms finix mangopay rainforest tilled; do
  pnpm pipeline judge --category marketplace-payments --product "$p" 2>&1 | tail -2
done
echo JUDGE_MARKETPLACE_DONE
