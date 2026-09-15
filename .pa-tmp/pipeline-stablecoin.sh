#!/bin/sh
set -e
cd "$(dirname "$0")/.."
pnpm pipeline extract --category stablecoin-payments
pnpm pipeline probe --category stablecoin-payments
pnpm pipeline collect-community --category stablecoin-payments
pnpm pipeline logos --category stablecoin-payments
pnpm pipeline popularity --category stablecoin-payments
for p in stripe-crypto circle bvnk coinbase-payments moonpay paxos; do
  echo "== judge stablecoin-payments/$p"
  pnpm pipeline judge --category stablecoin-payments --product "$p"
done
pnpm pipeline judge --category stablecoin-payments
echo "== stablecoin-payments judge complete"
