#!/bin/sh
set -e
cd "$(dirname "$0")/.."
pnpm pipeline probe --category banking-data-apis
pnpm pipeline collect-community --category banking-data-apis
pnpm pipeline logos --category banking-data-apis
pnpm pipeline popularity --category banking-data-apis
for p in stripe-financial-connections plaid mx mastercard-open-finance teller truelayer yapily; do
  echo "== judge banking-data-apis/$p"
  pnpm pipeline judge --category banking-data-apis --product "$p"
done
pnpm pipeline judge --category banking-data-apis
echo "== banking-data-apis judge complete"
