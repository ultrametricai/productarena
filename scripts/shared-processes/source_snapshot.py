import json
import subprocess
from pathlib import Path


def read_snapshot(root):
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=root, text=True)

    revision = git('rev-parse', 'HEAD').strip()
    workflows = sorted(path for path in git('ls-tree', '-rz', '--name-only', revision, '--', 'processes/equity').split('\0') if path.endswith('.json'))
    paths = ['processes/corpus.json', 'journeys/chains.json', 'processes/vendor-registry.json', *workflows]
    working_workflows = [path.relative_to(root).as_posix() for path in (Path(root) / 'processes/equity').rglob('*.json')]
    dirty = git('status', '--porcelain', '--untracked-files=all', '--', *sorted(set(paths + working_workflows)))
    if dirty.strip():
        raise SystemExit('Commit legacy source changes before importing or checking migration preservation.\n' + dirty)
    return revision, {path: json.loads(git('show', f'{revision}:{path}')) for path in paths}
