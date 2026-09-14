import { describe, expect, it } from 'vitest'
import { installVariants } from '@/lib/installVariants'

describe('installVariants', () => {
  it('derives pnpm/yarn/bun for global npm installs', () => {
    const v = installVariants('npm install -g productarena')
    expect(v.map((x) => x.manager)).toEqual(['npm', 'pnpm', 'yarn', 'bun'])
    expect(v[1].command).toBe('pnpm add -g productarena')
    expect(v[3].command).toBe('bun add -g productarena')
  })

  it('accepts the --global and add spellings', () => {
    const v = installVariants('npm install --global @restatedev/restate-server@latest @restatedev/restate@latest')
    expect(v.find((x) => x.manager === 'yarn')?.command).toBe(
      'yarn global add @restatedev/restate-server@latest @restatedev/restate@latest',
    )
    expect(installVariants('npm add @gusto/embedded-api').map((x) => x.manager)).toContain('pnpm')
  })

  it('derives local install variants including deno add npm:', () => {
    const v = installVariants('npm install @stripe/agent-toolkit')
    expect(v[1].command).toBe('pnpm add @stripe/agent-toolkit')
    expect(v.find((x) => x.manager === 'deno')?.command).toBe('deno add npm:@stripe/agent-toolkit')
  })

  it('prefixes every package in a multi-package deno add', () => {
    const v = installVariants('npm i react react-dom')
    expect(v.find((x) => x.manager === 'deno')?.command).toBe('deno add npm:react npm:react-dom')
  })

  it('does not derive npm variants when manager-specific flags are present', () => {
    // `--save-dev` is `--dev` on classic yarn — flags are curation, not derivation.
    const v = installVariants('npm install rdme --save-dev')
    expect(v).toHaveLength(1)
    expect(v[0].command).toBe('npm install rdme --save-dev')
    expect(installVariants('npm i -D wrangler@latest')).toHaveLength(1)
  })

  it('derives dlx/bunx for npx commands', () => {
    const v = installVariants('npx -y @usebruno/cli --version')
    expect(v.find((x) => x.manager === 'bun')?.command).toBe('bunx @usebruno/cli --version')
  })

  it('derives uv/pipx for pip installs', () => {
    expect(installVariants('pip install aider-chat').map((x) => x.manager)).toEqual(['pip', 'uv', 'pipx'])
  })

  it('normalizes python -m pip spellings into the pip family', () => {
    const v = installVariants('python -m pip install aider-install')
    expect(v.find((x) => x.manager === 'uv')?.command).toBe('uv pip install aider-install')
    expect(v.find((x) => x.manager === 'pipx')?.command).toBe('pipx install aider-install')
  })

  it('keeps flag-compatible uv pip but drops pipx for flagged pip commands', () => {
    const v = installVariants('pip install -U weaviate-client')
    expect(v.map((x) => x.manager)).toEqual(['pip', 'uv'])
    expect(v[1].command).toBe('uv pip install -U weaviate-client')
  })

  it('derives pipx ⇄ uv tool both ways', () => {
    expect(installVariants('uv tool install meltano').find((x) => x.manager === 'pipx')?.command).toBe(
      'pipx install meltano',
    )
    expect(installVariants('pipx install semgrep').find((x) => x.manager === 'uv')?.command).toBe(
      'uv tool install semgrep',
    )
    expect(
      installVariants('uv tool install git+https://github.com/ramp-public/ramp-cli.git').find(
        (x) => x.manager === 'pipx',
      )?.command,
    ).toBe('pipx install git+https://github.com/ramp-public/ramp-cli.git')
  })

  it('derives cargo binstall for plain cargo installs, but not flagged ones', () => {
    const v = installVariants('cargo install ripgrep')
    expect(v.find((x) => x.manager === 'binstall')?.command).toBe('cargo binstall ripgrep')
    expect(installVariants('cargo install ripgrep --locked')).toHaveLength(1)
  })

  it('leaves curation-only ecosystems untouched as a single variant', () => {
    for (const cmd of [
      'brew install stripe/stripe-cli/stripe',
      'gem install rails',
      'go install github.com/bolna-ai/cli/cmd/bolna@latest',
      'sudo apt install ros-jazzy-desktop',
      'composer require laravel/framework',
      'npm create mastra@latest',
      'curl -fsSL https://ollama.com/install.sh | sh',
    ]) {
      const v = installVariants(cmd)
      expect(v).toHaveLength(1)
      expect(v[0].command).toBe(cmd)
    }
  })
})
