import os
import time
import sys


def count(d):
    try:
        return len([f for f in os.listdir(d) if f.endswith('.json')])
    except OSError:
        return 0


while True:
    s = count('pipeline/cache/judge/design-tools/spline')
    r = count('pipeline/cache/judge/design-tools/rive')
    p = count('pipeline/cache/judge/notes-knowledge/poly')
    if s >= 53 and r >= 53 and p >= 54:
        print(f'ALL CELLS CACHED spline={s} rive={r} poly={p}', flush=True)
        sys.exit(0)
    time.sleep(60)
