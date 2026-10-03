#!/usr/bin/env bash
# Production deploy — batched cadence to keep Vercel build-minute costs down.
#
# Cost rationale (founder, 2026-09-18): dozens of per-merge deploys × minutes of Vercel build
# CPU each was the bill. Prebuilt upload was tested and is NOT viable here (this app builds 41
# function bundles / ~12GB of output; the prebuilt upload manifest exceeds Vercel's 10MB request
# limit, and shipping GBs per deploy would cost more than remote builds). The effective lever is
# CADENCE: push to git on every merge (free), deploy AT MOST once per merge-wave / founder-
# visible batch — target ≤3 production deploys/day. This script enforces a soft floor: it
# refuses to deploy if the last deploy was <2h ago unless FORCE=1.
#
# Usage: ./scripts/deploy-prod.sh   (from anywhere; operates on /tmp/pa-deploy @ origin/main)
set -euo pipefail

REPO=/Users/judegomila/Documents/GitHub/productarena
DEPLOY=/tmp/pa-deploy

if [ ! -d "$DEPLOY/.git" ]; then
  git clone --depth 1 https://github.com/ultrametricai/ultrametric.git "$DEPLOY"
fi
rm -rf "$DEPLOY/.vercel" && cp -R "$REPO/.vercel" "$DEPLOY/.vercel"
cd "$DEPLOY"
git fetch origin -q && git reset --hard origin/main -q
echo "deploying $(git log --oneline -1)"

STAMP=/tmp/pa-deploy/.last-deploy-epoch
NOW=$(date +%s)
if [ "${FORCE:-0}" != "1" ] && [ -f "$STAMP" ]; then
  LAST=$(cat "$STAMP"); AGE=$(( NOW - LAST ))
  if [ "$AGE" -lt 7200 ]; then
    echo "SKIP: last deploy ${AGE}s ago (<2h). Batch more merges or FORCE=1." ; exit 0
  fi
fi
# --turbo: the Turbo build machine (30 vCPU, 64 GB disk vs Standard's 32 GB). The 32 GB disk
# is what every post-team-transfer deploy overflowed (ENOSPC packaging ~13 GB of static output
# twice); Elastic machine selection kept right-sizing us DOWN to Standard. Billed per CPU-minute.
vercel deploy --prod --archive=tgz --yes --turbo
echo "$NOW" > "$STAMP"
