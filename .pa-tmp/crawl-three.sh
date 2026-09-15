#!/bin/sh
set -x
pnpm pipeline crawl --category card-issuing
pnpm pipeline crawl --category tax-automation
pnpm pipeline crawl --category marketplace-payments
echo CRAWL_THREE_DONE
