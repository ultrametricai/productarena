#!/usr/bin/env python3
# Registers the security-keys, authenticator-apps, and game-engines arenas (founder asks
# 2026-09-15): categories.json entries, arena-sections placement (security-legal ×2,
# dev-tools ×1), arena-icons, adjacent-arenas, roadmap (game-engines flip to live +
# two new live entries), search-aliases. Idempotent — skips anything already present.
# Community seeds + popularity packages land in a second pass after live verification
# (.pa-tmp/register-three-arenas-seeds.py).
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

# --- categories.json ---
CATS = [
    {
        'id': 'security-keys',
        'name': 'Hardware Security Keys',
        'description': (
            'Hardware authenticators — the physical FIDO2/WebAuthn keys that make phishing-resistant login real: '
            'resident-key passkeys, PIV smart-card and OpenPGP modes, OTP fallbacks, NFC and USB-C form factors, '
            'attestation, and fleet provisioning at enterprise scale. Judged honestly on hardware plus ecosystem: '
            'protocol coverage, what exists beyond FIDO, enrollment and lockout recovery, fleet management APIs, '
            'developer tooling (CLIs, SDKs, attestation), firmware openness — Yubico\'s locked-down closed firmware '
            'versus Nitrokey\'s and SoloKeys\' open-source stacks is a real axis, not a footnote — and the agent '
            'angle: whether provisioning and auditing keys is a human-only console job or something an agent can '
            'drive through documented CLIs and APIs.'
        ),
        'personas': ['security-engineer', 'it-admin', 'developer', 'power-user', 'ai-native'],
        'themes': [
            'protocol-coverage',
            'beyond-fido',
            'form-factors',
            'enrollment-recovery',
            'fleet-management',
            'developer-tooling',
            'firmware-openness',
            'ecosystem-compat',
        ],
    },
    {
        'id': 'authenticator-apps',
        'name': 'Authenticator Apps',
        'description': (
            'TOTP and passkey apps — the software second factor on a billion phones: code generation, passkey '
            'storage and sync, encrypted backup, and the export/import openness that decides whether your 2FA seeds '
            'are portable or hostage. The market splits cleanly: platform giants ship free but closed (Google '
            'Authenticator\'s QR-transfer-only export, Authy\'s no-export lock-in and 2024 desktop shutdown), '
            'password managers absorb 2FA into the vault (1Password, Bitwarden, Proton Pass), and open-source '
            'challengers compete on portability and self-hosting (Ente Auth, 2FAS, Bitwarden\'s self-hostable '
            'server). Judged on TOTP fundamentals, passkey support, sync/backup, portability, surfaces (watch, '
            'desktop, browser autofill), self-hosting, security posture (E2EE design, audits, breach alerting), '
            'and the agent angle: which vaults an agent can actually query for a code via CLI or local API.'
        ),
        'personas': ['everyday-user', 'power-user', 'security-engineer', 'it-admin', 'ai-native'],
        'themes': [
            'totp-core',
            'passkey-support',
            'sync-backup',
            'portability',
            'surfaces',
            'self-hosting',
            'security-posture',
            'team-admin',
        ],
    },
    {
        'id': 'game-engines',
        'name': 'Game Engines',
        'description': (
            'Game engines and real-time 3D frameworks, from full-editor incumbents (Unity, Unreal) through the '
            'open-source challenger (Godot) to the npm-installable web runtimes (three.js, Babylon.js, PlayCanvas, '
            'Phaser) and Rust\'s code-first ECS (Bevy). Judged on the classic axes — rendering, scripting, editor '
            'tooling, asset pipeline, platform export — plus the ones the AI era added: headless/CI builds and '
            'scriptable editors as agent surfaces, MCP servers (official versus community), LLM copilots, '
            'codegen-friendly APIs, and licensing trust — Unity\'s 2023 runtime-fee episode and 2024 cancellation '
            'are part of the record, cited honestly, as is Unreal\'s 5%-over-$1M royalty and Godot\'s MIT license.'
        ),
        'personas': ['game-developer', 'technical-artist', 'studio-lead', 'web-developer', 'ai-native'],
        'themes': [
            'core-engine',
            'scripting',
            'editor-tooling',
            'asset-pipeline',
            'platform-export',
            'headless-automation',
            'ai-workflows',
            'licensing-openness',
        ],
    },
]

cats = load('data/categories.json')
have = {c['id'] for c in cats}
for c in CATS:
    if c['id'] not in have:
        cats.append(c)
        print(f"categories.json: added {c['id']}")
dump('data/categories.json', cats)

# --- arena-sections.json ---
sections = load('data/arena-sections.json')
placement = {
    'security-legal': ['security-keys', 'authenticator-apps'],
    'dev-tools': ['game-engines'],
}
for s in sections['sections']:
    for aid in placement.get(s['id'], []):
        if aid not in s['arenaIds']:
            s['arenaIds'].append(aid)
            print(f"arena-sections.json: {aid} -> {s['id']}")
dump('data/arena-sections.json', sections)

# --- arena-icons.json ---
icons = load('data/arena-icons.json')
for aid, icon in [('security-keys', '🗝️'), ('authenticator-apps', '🔢'), ('game-engines', '🎮')]:
    if aid not in icons:
        icons[aid] = icon
        print(f'arena-icons.json: {aid} {icon}')
dump('data/arena-icons.json', icons)

# --- adjacent-arenas.json (groups of related arena ids) ---
adj = load('data/adjacent-arenas.json')
new_groups = [
    ['security-keys', 'authenticator-apps', 'auth-platforms', 'security-scanners'],
    ['game-engines', 'frontend-frameworks', 'design-tools', 'robotics-platforms'],
]
existing = {tuple(g) for g in adj}
for g in new_groups:
    if tuple(g) not in existing:
        adj.append(g)
        print(f'adjacent-arenas.json: added {g}')
dump('data/adjacent-arenas.json', adj)

# --- arena-roadmap.json ---
rm = load('data/arena-roadmap.json')
by_id = {e['id']: e for e in rm}
if 'game-engines' in by_id:
    e = by_id['game-engines']
    if e['status'] != 'live':
        e['status'] = 'live'
        e['candidateProducts'] = ['Unity', 'Unreal Engine', 'Godot', 'three.js', 'Babylon.js', 'Bevy', 'PlayCanvas', 'Phaser']
        e['rationale'] = 'Live arena: the Unity runtime-fee episode made engine licensing a trust axis, and headless builds + MCP servers made engines an agent surface.'
        print('arena-roadmap.json: game-engines -> live')
for entry in [
    {
        'id': 'security-keys',
        'name': 'Hardware Security Keys',
        'tier': 2,
        'status': 'live',
        'g2Equivalent': 'Passwordless Authentication (hardware token vendors)',
        'candidateProducts': ['YubiKey', 'Google Titan', 'Nitrokey', 'SoloKeys Solo 2', 'Feitian', 'Token2', 'Ledger'],
        'rationale': 'Live arena (founder ask): passkeys made hardware authenticators mainstream; firmware openness and fleet APIs split the field.',
        'aiEraAngle': 'Can an agent provision and audit a key fleet — CLIs (ykman, nitropy), enterprise delivery APIs, attestation — or is it console-only?',
    },
    {
        'id': 'authenticator-apps',
        'name': 'Authenticator Apps',
        'tier': 2,
        'status': 'live',
        'g2Equivalent': 'Multi-Factor Authentication (MFA) Software',
        'candidateProducts': ['Google Authenticator', 'Microsoft Authenticator', 'Authy', '1Password', 'Bitwarden', 'Proton Pass', 'Ente Auth', '2FAS'],
        'rationale': 'Live arena (founder ask): the app on a billion phones nobody comparison-shops — export lock-in vs OSS portability is the real fight.',
        'aiEraAngle': 'Which vaults can an agent query for a TOTP code (bw/op CLIs, local serve APIs) — the 2FA step is the last blocker in most automated logins.',
    },
]:
    if entry['id'] not in by_id:
        rm.append(entry)
        print(f"arena-roadmap.json: added {entry['id']} (live)")
dump('data/arena-roadmap.json', rm)

# --- search-aliases.json ---
sa = load('data/search-aliases.json')
aliases = {
    'security-keys': ['security keys', 'hardware keys', 'yubikey vs', 'fido2 keys', 'passkey hardware', 'u2f'],
    'authenticator-apps': ['authenticator', '2fa apps', 'totp apps', 'mfa apps', 'one-time codes', 'google authenticator vs'],
    'game-engines': ['game engines', 'game dev', 'unity vs unreal', 'unity vs godot', '3d engines', 'webgl engines'],
}
for aid, al in aliases.items():
    if aid not in sa['arenas']:
        sa['arenas'][aid] = al
        print(f'search-aliases.json: added {aid}')
dump('data/search-aliases.json', sa)

print('done')
