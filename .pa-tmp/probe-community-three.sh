#!/bin/sh
set -x
pnpm pipeline probe --category card-issuing
pnpm pipeline probe --category tax-automation
pnpm pipeline probe --category marketplace-payments
pnpm pipeline collect-community --category card-issuing
pnpm pipeline collect-community --category tax-automation
pnpm pipeline collect-community --category marketplace-payments
echo PROBE_COMMUNITY_THREE_DONE
