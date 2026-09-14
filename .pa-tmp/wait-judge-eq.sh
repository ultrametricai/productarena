#!/bin/sh
until [ "$(find pipeline/cache/judge/equity-management -name "*.json" | wc -l | tr -d " ")" -ge 336 ]; do sleep 30; done
echo JUDGE_CACHE_336
