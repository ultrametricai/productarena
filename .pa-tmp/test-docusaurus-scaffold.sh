#!/bin/sh
d=$(mktemp -d) && cd "$d" || exit 1
npx -y create-docusaurus@latest pa-probe classic --typescript --skip-install 2>&1 | tail -8
echo "--- scaffold files ---"
ls pa-probe | head -10
cd / && rm -rf "$d"
