#!/bin/sh
# Judge the billing-subscriptions arena product-by-product (cache-resumable), then assemble.
set -e
for p in stripe-billing chargebee recurly lago orb metronome; do
  pnpm pipeline judge --category billing-subscriptions --product "$p" 2>&1 | tail -2
done
echo JUDGE_BILLING_DONE
