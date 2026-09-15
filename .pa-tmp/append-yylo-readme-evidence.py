#!/usr/bin/env python3
"""Append verbatim GitHub-README evidence items for yylo (software-factory).

Issue #19 (vendor-submitted starter evidence pack): every excerpt below was
independently re-fetched and verified verbatim against
raw.githubusercontent.com/yylo-dev/yylo/HEAD/README.md on 2026-09-14 before
being recorded — the submitter's fetchedAt stamps are NOT trusted or reused.
"""
import json

f = 'data/software-factory/evidence/yylo.json'
d = json.load(open(f))
now = '2026-09-14T23:05:00.000Z'
add = [
    {"id": "yylo-gh-3", "tier": "github", "url": "https://github.com/yylo-dev/yylo",
     "excerpt": "YYLO is a command-line orchestrator for coding agents, repeatable workflows, and receipt-backed repository changes. It is for developers who want a quick agent loop and for project operators who need typed task, validation, merge, and release-readiness boundaries.",
     "fetchedAt": now},
    {"id": "yylo-gh-4", "tier": "github", "url": "https://github.com/yylo-dev/yylo",
     "excerpt": "`task start` freezes the protected target SHA, creates a dedicated branch/worktree, and completes configured dependency hydration before reporting `WORKING`.",
     "fetchedAt": now},
    {"id": "yylo-gh-5", "tier": "github", "url": "https://github.com/yylo-dev/yylo",
     "excerpt": "`merge land` selects one immutable task source, composes in a private detached candidate, and uses Git expected-old ref protection. A moved target requires recomposition and renewed candidate checks.",
     "fetchedAt": now},
    {"id": "yylo-gh-6", "tier": "github", "url": "https://github.com/yylo-dev/yylo",
     "excerpt": "Tests and semantic reviews are explicit project checks outside merge. Merge launches no models, chooses no reviewers, schedules no suites, and maintains no validation cache.",
     "fetchedAt": now},
]
ids = {e['id'] for e in d}
for a in add:
    if a['id'] not in ids:
        d.append(a)
with open(f, 'w') as fh:
    json.dump(d, fh, indent=2)
    fh.write('\n')
print('total items:', len(d))
