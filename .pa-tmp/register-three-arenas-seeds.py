#!/usr/bin/env python3
# Second registration pass for the security-keys / authenticator-apps / game-engines bring-up:
# community seeds (every HN item id verified live via hn.algolia on 2026-09-15 — see
# .pa-tmp/research-*.md) and registry-verified popularity packages. Products with no genuine
# on-topic HN discussion (feitian, token2, 2fas) get NO seeds — honesty over coverage.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

HN = 'https://hn.algolia.com/api/v1/items/'

seeds = load('pipeline/seeds/community.json')
NEW_SEEDS = {
    'security-keys': {
        'yubikey': [HN + '41434500', HN + '24663989', HN + '35091768'],
        'google-titan': [HN + '17610516', HN + '17875658', HN + '19921360'],
        'nitrokey': [HN + '35706858', HN + '24294307', HN + '35336610'],
        'solokeys': [HN + '20648740', HN + '25919556'],
    },
    'authenticator-apps': {
        'google-authenticator': [HN + '35690398', HN + '35708869', HN + '28324626'],
        'microsoft-authenticator': [HN + '41275846', HN + '44426985', HN + '27192997'],
        'authy': [HN + '40874341', HN + '39360439', HN + '32622923'],
        '1password': [HN + '14403911', HN + '28145247', HN + '29993961'],
        'bitwarden': [HN + '41940580', HN + '47876043', HN + '48163389'],
        'proton-pass': [HN + '36784326', HN + '35638902', HN + '36507707'],
        'ente-auth': [HN + '40883839', HN + '37714283'],
    },
    'game-engines': {
        'unity': [HN + '37503837', HN + '37491002', HN + '44973269'],
        'unreal': [HN + '23167794', HN + '30920345', HN + '27290854'],
        'godot': [HN + '34982889', HN + '36614114', HN + '23668918'],
        'threejs': [HN + '38786581', HN + '44249565', HN + '19944990'],
        'babylonjs': [HN + '35645857', HN + '14758153', HN + '6200085'],
        'bevy': [HN + '24123283', HN + '29854416', HN + '38144417'],
        'playcanvas': [HN + '40379982', HN + '24018097', HN + '7846494'],
        'phaser': [HN + '16372375', HN + '30656961', HN + '37499163'],
    },
}
for cat, s in NEW_SEEDS.items():
    if cat not in seeds:
        seeds[cat] = s
        print(f'community.json: added {cat} seeds ({sum(len(v) for v in s.values())} items)')
dump('pipeline/seeds/community.json', seeds)

# Registry-verified 2026-09-15 (exact versions in .pa-tmp/research-*.md):
# yubikey-manager 5.9.2, pynitrokey 0.13.0, solo-python 0.1.1 (Solo 1 CLI, bit-rotted but
# official), @bitwarden/cli 2026.8.0, three 0.186.0 (12.2M/wk), @babylonjs/core 9.26.1,
# phaser 4.2.1, playcanvas 2.22.2. bevy is cargo-only (unsupported kind) — popularity rides
# its urls.github instead.
pkgs = load('pipeline/popularity-packages.json')
added = []
for pid, entry in {
    'yubikey': {'pypi': 'yubikey-manager'},
    'nitrokey': {'pypi': 'pynitrokey'},
    'solokeys': {'pypi': 'solo-python'},
    'bitwarden': {'npm': '@bitwarden/cli'},
    'threejs': {'npm': 'three'},
    'babylonjs': {'npm': '@babylonjs/core'},
    'phaser': {'npm': 'phaser'},
    'playcanvas': {'npm': 'playcanvas'},
}.items():
    if pid not in pkgs:
        pkgs[pid] = entry
        added.append(pid)
if added:
    dump('pipeline/popularity-packages.json', pkgs)
    print(f'popularity-packages.json: added {added}')
print('done')
