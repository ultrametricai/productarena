import type { LocalProbe } from './types'

export const probes: LocalProbe[] = [
    {
      // The open skills.sh CLI runs keylessly from npm.
      probeId: 'cli-version',
      productId: 'skills-cli',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', 'skills', '--version'],
      displayCommand: 'npx -y skills --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Lists a repo's skills (name + trigger description) WITHOUT installing — the
      // review-before-install path, keyless against a public repo.
      probeId: 'registry-list',
      productId: 'skills-cli',
      storyIds: ['browse-searchable-catalog', 'inspect-before-install'],
      bin: 'npx',
      argv: ['npx', '-y', 'skills', 'add', 'vercel-labs/agent-skills', '--list'],
      displayCommand: 'npx -y skills add vercel-labs/agent-skills --list',
      // The pty recording colorizes the count (`Found \x1b[32m9\x1b[39m skills`) — allow ANSI
      // escapes between the words.
      expect: /Found .{0,12}\d+.{0,12} skills/,
      timeoutMs: 180_000,
    },
    {
      // A REAL end-to-end skill install into a scratch project dir: fetches obra/superpowers,
      // copies one skill into ./.claude/skills, then prints the installed SKILL.md frontmatter.
      // Fully keyless and non-interactive (agent-detected).
      probeId: 'scratch-install-roundtrip',
      productId: 'superpowers',
      storyIds: ['one-command-install', 'agent-installs-skill', 'plain-files-portability'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-skill-sp; mkdir -p /tmp/pa-skill-sp; cd /tmp/pa-skill-sp; npx -y skills add obra/superpowers --skill test-driven-development -a claude-code -y --copy; echo "--- installed SKILL.md frontmatter ---"; sed -n 1,4p .claude/skills/test-driven-development/SKILL.md; cd /; rm -rf /tmp/pa-skill-sp',
      ],
      displayCommand: 'npx -y skills add obra/superpowers --skill test-driven-development -a claude-code -y --copy  # in a scratch dir, then print installed SKILL.md frontmatter',
      expect: /name: test-driven-development/,
      timeoutMs: 300_000,
    },
    {
      // Same REAL install roundtrip for the official Anthropic skills repo (skill-creator).
      probeId: 'scratch-install-roundtrip',
      productId: 'anthropic-skills',
      storyIds: ['one-command-install', 'agent-installs-skill', 'selective-install'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-skill-an; mkdir -p /tmp/pa-skill-an; cd /tmp/pa-skill-an; npx -y skills add anthropics/skills --skill skill-creator -a claude-code -y --copy; echo "--- installed SKILL.md frontmatter ---"; sed -n 1,3p .claude/skills/skill-creator/SKILL.md; cd /; rm -rf /tmp/pa-skill-an',
      ],
      displayCommand: 'npx -y skills add anthropics/skills --skill skill-creator -a claude-code -y --copy  # in a scratch dir, then print installed SKILL.md frontmatter',
      expect: /name: skill-creator/,
      timeoutMs: 300_000,
    },
    {
      // Same REAL install roundtrip for mattpocock/skills (tdd) — selective install by name.
      probeId: 'scratch-install-roundtrip',
      productId: 'mattpocock-skills',
      storyIds: ['one-command-install', 'agent-installs-skill', 'selective-install'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-skill-mp; mkdir -p /tmp/pa-skill-mp; cd /tmp/pa-skill-mp; npx -y skills add mattpocock/skills --skill tdd -a claude-code -y --copy; echo "--- installed SKILL.md frontmatter ---"; sed -n 1,3p .claude/skills/tdd/SKILL.md; cd /; rm -rf /tmp/pa-skill-mp',
      ],
      displayCommand: 'npx -y skills add mattpocock/skills --skill tdd -a claude-code -y --copy  # in a scratch dir, then print installed SKILL.md frontmatter',
      expect: /name: tdd/,
      timeoutMs: 300_000,
    },
    {
      // openai/plugins skills install cross-harness: plugin-creator lands in ./.agents/skills
      // (the Codex agent dir) — proving the catalog's skills are plain portable folders.
      probeId: 'scratch-install-roundtrip',
      productId: 'codex-plugins',
      storyIds: ['agent-installs-skill', 'plain-files-portability'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-skill-cx; mkdir -p /tmp/pa-skill-cx; cd /tmp/pa-skill-cx; npx -y skills add openai/plugins --skill plugin-creator -a codex -y --copy; echo "--- installed SKILL.md frontmatter ---"; sed -n 1,3p .agents/skills/plugin-creator/SKILL.md; cd /; rm -rf /tmp/pa-skill-cx',
      ],
      displayCommand: 'npx -y skills add openai/plugins --skill plugin-creator -a codex -y --copy  # in a scratch dir, then print installed SKILL.md frontmatter',
      expect: /name: plugin-creator/,
      timeoutMs: 300_000,
    },
    {
      // The Codex marketplace manifest is a public, keyless JSON catalog of curated plugins.
      probeId: 'marketplace-manifest',
      productId: 'codex-plugins',
      storyIds: ['browse-searchable-catalog', 'team-distribution'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        'curl -s https://raw.githubusercontent.com/openai/plugins/HEAD/.agents/plugins/marketplace.json | head -40',
      ],
      displayCommand: 'curl -s https://raw.githubusercontent.com/openai/plugins/HEAD/.agents/plugins/marketplace.json | head -40',
      expect: /"openai-curated"/,
      timeoutMs: 60_000,
    },
]
