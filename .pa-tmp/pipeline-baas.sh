#!/bin/sh
set -x
pnpm pipeline crawl --category banking-as-a-service
pnpm pipeline extract --category banking-as-a-service
pnpm pipeline probe --category banking-as-a-service
pnpm pipeline collect-community --category banking-as-a-service
pnpm pipeline logos --category banking-as-a-service
pnpm pipeline popularity --category banking-as-a-service
echo BAAS_PRE_JUDGE_DONE
for p in stripe-treasury unit increase column synctera treasury-prime; do
  pnpm pipeline judge --category banking-as-a-service --product "$p" 2>&1 | tail -2
done
echo JUDGE_BAAS_DONE
