#!/bin/sh
set -e
for p in stripe-treasury unit increase column synctera treasury-prime; do
  pnpm pipeline judge --category banking-as-a-service --product "$p" 2>&1 | tail -3
done
echo JUDGE_BAAS_DONE
