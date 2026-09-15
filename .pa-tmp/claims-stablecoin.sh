#!/bin/sh
set -e
cd "$(dirname "$0")/.."
for p in stripe-crypto circle bvnk coinbase-payments moonpay paxos; do
  n=0
  until pnpm pipeline claims --category stablecoin-payments --product "$p"; do
    n=$((n+1)); if [ "$n" -ge 3 ]; then exit 1; fi
    echo "retry $n for $p"; sleep 20
  done
done
PA_RECORD=1 pnpm pipeline probe-record --category stablecoin-payments
echo "== stablecoin claims + proofs complete"
