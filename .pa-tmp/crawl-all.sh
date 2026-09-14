#!/bin/sh
set -x
pnpm pipeline crawl --category ai-coding --product antigravity
pnpm pipeline crawl --category ai-research-agents --product notebooklm
pnpm pipeline crawl --category ai-assistants --product grok
pnpm pipeline crawl --category design-tools --product claude-design
echo CRAWL_DONE
