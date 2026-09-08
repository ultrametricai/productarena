#!/bin/sh
d=$(mktemp -d) && cd "$d" && uvx meltano init pa-probe 2>&1 | tail -6; ls pa-probe; cd / && rm -rf "$d"
