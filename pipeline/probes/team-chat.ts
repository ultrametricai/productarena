import type { LocalProbe } from './types'

export const probes: LocalProbe[] = [
    {
      // Buzz has no docs site or llms.txt — its agent-facing documentation IS the open repo.
      // The raw README is the canonical "what agents can do here" surface (agents as teammates,
      // buzz-cli, ACP harness, git hosting, voice huddles) and is keylessly fetchable.
      probeId: 'oss-readme-agent-docs',
      productId: 'buzz',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://raw.githubusercontent.com/block/buzz/main/README.md | head -20'],
      displayCommand: 'curl -s https://raw.githubusercontent.com/block/buzz/main/README.md | head -20',
      expect: /Buzz/,
      timeoutMs: 30_000,
    },
    {
      // The repo ships a production single-node Docker Compose bundle (Postgres, Redis, MinIO,
      // Caddy TLS) — the self-host story is real, documented, and keylessly verifiable.
      probeId: 'selfhost-compose-docs',
      productId: 'buzz',
      storyIds: ['openness-self-host'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://raw.githubusercontent.com/block/buzz/main/deploy/compose/README.md | head -8'],
      displayCommand: 'curl -s https://raw.githubusercontent.com/block/buzz/main/deploy/compose/README.md | head -8',
      expect: /Docker Compose deployment/,
      timeoutMs: 30_000,
    },
    {
      // The LICENSE file at HEAD is the Apache License 2.0 verbatim — open license verified
      // from the source of truth, not a badge.
      probeId: 'open-license-apache2',
      productId: 'buzz',
      storyIds: ['openness-open-license'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://raw.githubusercontent.com/block/buzz/main/LICENSE | head -3'],
      displayCommand: 'curl -s https://raw.githubusercontent.com/block/buzz/main/LICENSE | head -3',
      expect: /Apache License/,
      timeoutMs: 30_000,
    },
]
