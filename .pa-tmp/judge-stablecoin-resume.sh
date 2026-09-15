#!/bin/sh
set -e
cd "$(dirname "$0")/.."
for p in stripe-crypto circle bvnk coinbase-payments moonpay paxos; do
  echo "== judge stablecoin-payments/$p"
  n=0
  until pnpm pipeline judge --category stablecoin-payments --product "$p"; do
    n=$((n+1))
    if [ "$n" -ge 4 ]; then echo "giving up on $p after $n retries"; exit 1; fi
    echo "retry $n for $p after transient LLM failure"; sleep 30
  done
done
pnpm pipeline judge --category stablecoin-payments
echo "== stablecoin judge complete"
