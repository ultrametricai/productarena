#!/bin/sh
set -x
pnpm pipeline extract --category card-issuing
pnpm pipeline extract --category tax-automation
pnpm pipeline extract --category marketplace-payments
echo EXTRACT_THREE_DONE
