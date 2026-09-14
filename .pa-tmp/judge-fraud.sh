#!/bin/sh
# Judge the fraud-prevention arena product-by-product (cache-resumable), then assemble.
set -e
for p in stripe-radar sift signifyd forter riskified; do
  pnpm pipeline judge --category fraud-prevention --product "$p" 2>&1 | tail -2
done
echo JUDGE_FRAUD_DONE
