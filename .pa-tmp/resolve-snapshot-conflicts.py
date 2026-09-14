#!/usr/bin/env python3
"""Resolve daily-snapshot cherry-pick conflicts deterministically.

- *.jsonl (append-only logs): union — ours as-is, then any theirs lines not
  already present (order preserved; snapshot rows carry their own dates).
- popularity.json (per-product latest-state maps with fetchedAt): per-product
  freshest-fetchedAt wins across ours/theirs (never loses a product present on
  only one side, e.g. yylo which postdates the snapshot).
Run from the repo root during an active cherry-pick; stages resolved files.
"""
import json
import subprocess
import sys


def show(stage: int, path: str) -> str | None:
    r = subprocess.run(['git', 'show', f':{stage}:{path}'], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def main() -> None:
    out = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=U'],
                         capture_output=True, text=True, check=True).stdout.split()
    if not out:
        print('no unmerged files')
        return
    for path in out:
        ours, theirs = show(2, path), show(3, path)
        if ours is None or theirs is None:
            print(f'SKIP (add/delete conflict, resolve by hand): {path}')
            sys.exit(1)
        if path.endswith('.jsonl'):
            ours_lines = ours.splitlines()
            seen = set(ours_lines)
            merged = ours_lines + [l for l in theirs.splitlines() if l and l not in seen]
            with open(path, 'w') as fh:
                fh.write('\n'.join(merged) + '\n')
            print(f'union  {path} (+{len(merged) - len(ours_lines)} lines)')
        elif path.endswith('popularity.json'):
            o, t = json.loads(ours), json.loads(theirs)
            merged = {}
            for k in list(o) + [k for k in t if k not in o]:
                a, b = o.get(k), t.get(k)
                if a is None or b is None:
                    merged[k] = a or b
                else:
                    merged[k] = a if a.get('fetchedAt', '') >= b.get('fetchedAt', '') else b
            with open(path, 'w') as fh:
                json.dump(merged, fh, indent=2)
                fh.write('\n')
            print(f'fresh  {path} ({len(merged)} products)')
        else:
            print(f'SKIP (no rule): {path}')
            sys.exit(1)
        subprocess.run(['git', 'add', path], check=True)


if __name__ == '__main__':
    main()
