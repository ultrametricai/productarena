#!/bin/sh
set -e
cd "$(dirname "$0")/.."
for p in stripe-identity persona entrust-onfido sumsub veriff plaid-idv; do
  echo "== judge identity-verification/$p"
  pnpm pipeline judge --category identity-verification --product "$p"
done
pnpm pipeline judge --category identity-verification
echo "== IDV judge complete"
