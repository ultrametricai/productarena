#!/bin/sh
set -x
pnpm exec vitest run --maxWorkers=4
echo VITEST_EXIT=$?
pnpm build
echo BUILD_EXIT=$?
pnpm exec tsc --noEmit
echo TSC_EXIT=$?
pnpm exec tsx pipeline/scripts/recompute-check.ts
echo RECOMPUTE_EXIT=$?
echo GATES_DONE
