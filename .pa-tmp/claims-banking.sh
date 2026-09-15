#!/bin/sh
set -e
cd "$(dirname "$0")/.."
for p in stripe-financial-connections plaid mx mastercard-open-finance teller truelayer yapily; do
  pnpm pipeline claims --category banking-data-apis --product "$p"
done
PA_RECORD=1 pnpm pipeline probe-record --category banking-data-apis
echo "== banking claims + proofs complete"
