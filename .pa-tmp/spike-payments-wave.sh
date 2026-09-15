#!/bin/sh
# Part B: deep spikes on Stripe's nearest payments competitors, run THROUGH the spike engine
# (one exhaustive budget-capped pass each; churn policy applied inside the engine).
set -e
cd "$(dirname "$0")/.."
for p in adyen paypal square checkout-com airwallex paddle polar mollie; do
  echo "==== spike payments/$p"
  pnpm tsx pipeline/scripts/spike-engine.ts --process --category payments --product "$p" --budget-urls 12
done
echo "==== payments spike wave complete"
