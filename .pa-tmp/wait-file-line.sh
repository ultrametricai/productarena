#!/bin/sh
# Usage: wait-file-line.sh <file> <grep-pattern>
while :; do
  if grep -q "$2" "$1" 2>/dev/null; then grep "$2" "$1" | tail -2; exit 0; fi
  sleep 10
done
