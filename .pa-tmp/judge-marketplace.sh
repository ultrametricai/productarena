#!/bin/sh
set -e
for p in stripe-connect adyen-for-platforms finix mangopay rainforest tilled; do
  pnpm pipeline judge --category marketplace-payments --product "$p" 2>&1 | tail -2
done
echo JUDGE_MARKETPLACE_DONE
