import type { LocalProbe } from './types'

export const probes: LocalProbe[] = [
    {
      // Omnara's docs publish a full llms.txt index (the docs domain 301s the bare path, so
      // follow redirects) — the agent-docs surface in one keyless fetch.
      probeId: 'llms-docs-index',
      productId: 'omnara',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -sL --max-time 20 https://docs.omnara.com/llms.txt | head -6'],
      displayCommand: 'curl -sL https://docs.omnara.com/llms.txt | head -6',
      expect: /# Omnara/,
      timeoutMs: 30_000,
    },
    {
      // Mintlify-style docs serve clean markdown at any page URL + .md — machine-readable docs
      // without scraping HTML.
      probeId: 'docs-md-endpoint',
      productId: 'omnara',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.omnara.com/introduction.md | head -6'],
      displayCommand: 'curl -s https://docs.omnara.com/introduction.md | head -6',
      expect: /Documentation Index/,
      timeoutMs: 30_000,
    },
    {
      // YYLO's official CLI (@yylo/cli, bins yy/yylo) is published on the public npm
      // registry — metadata-only `npm view`, no package code is executed (vendor-submitted
      // product, issue #19; static tarball audit in that issue's bring-up commit).
      probeId: 'cli-npm-registry',
      productId: 'yylo',
      storyIds: ['agentic-official-cli'],
      bin: 'npm',
      argv: ['sh', '-c', 'npm view @yylo/cli name version bin 2>&1 | head -8'],
      displayCommand: 'npm view @yylo/cli name version bin',
      expect: /@yylo\/cli/,
      timeoutMs: 60_000,
    },
    {
      // The yylo source repo ships an MIT LICENSE at its root — raw.githubusercontent is
      // keyless and not subject to the anonymous GitHub API rate limit.
      probeId: 'github-mit-license',
      productId: 'yylo',
      storyIds: ['openness-open-license'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://raw.githubusercontent.com/yylo-dev/yylo/HEAD/LICENSE | head -3'],
      displayCommand: 'curl -s https://raw.githubusercontent.com/yylo-dev/yylo/HEAD/LICENSE | head -3',
      expect: /MIT License/,
      timeoutMs: 30_000,
    },
    {
      // HumanLayer's official CLI (@humanlayer/cli, the documented daemon-host install:
      // docs.humanlayer.com/guide/remote-daemons) installs keylessly from npm and prints its
      // version.
      probeId: 'cli-npx-version',
      productId: 'humanlayer',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['sh', '-c', 'npx -y @humanlayer/cli@latest --version 2>&1 | tail -1'],
      displayCommand: 'npx -y @humanlayer/cli@latest --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 240_000,
    },
    {
      // The docs (no llms.txt / .md endpoints — VitePress HTML only) document `humanlayer
      // automation run`: one Cloud-visible coding session from CI/cron with a personal access
      // token, no interactive login — the headless-CI surface, keylessly verified.
      probeId: 'docs-headless-automation',
      productId: 'humanlayer',
      storyIds: ['headless-ci-execution'],
      bin: 'curl',
      argv: ['sh', '-c', "curl -s --max-time 20 https://docs.humanlayer.com/guide/automation-sessions | grep -o -m 2 -E 'humanlayer automation run|personal access token' | head -4"],
      displayCommand: "curl -s https://docs.humanlayer.com/guide/automation-sessions | grep -oE 'humanlayer automation run|personal access token'",
      expect: /humanlayer automation run/,
      timeoutMs: 30_000,
    },
    {
      // The GitHub integration guide documents creating HumanLayer tasks from GitHub issues
      // with artifact links back to the source issue — the ticket-to-task surface.
      probeId: 'docs-issue-to-task',
      productId: 'humanlayer',
      storyIds: ['assign-task-from-ticket'],
      bin: 'curl',
      argv: ['sh', '-c', "curl -s --max-time 20 https://docs.humanlayer.com/guide/github-integration | grep -o -m 2 -E 'Create Tasks from Issues|artifact links' | head -4"],
      displayCommand: "curl -s https://docs.humanlayer.com/guide/github-integration | grep -oE 'Create Tasks from Issues|artifact links'",
      expect: /Create Tasks from Issues/,
      timeoutMs: 30_000,
    },
]
