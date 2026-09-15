#!/bin/sh
set -e
cd "$(dirname "$0")/.."
for p in stripe-identity persona entrust-onfido sumsub veriff plaid-idv; do
  pnpm pipeline claims --category identity-verification --product "$p"
done
echo "== IDV claims complete"
