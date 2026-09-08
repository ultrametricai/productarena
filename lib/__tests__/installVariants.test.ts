import { describe, expect, it } from 'vitest'
import { installVariants } from '@/lib/installVariants'

describe('installVariants', () => {
  it('derives pnpm/yarn/bun for global npm installs', () => {
    const v = installVariants('npm install -g productarena')
    expect(v.map((x) => x.manager)).toEqual(['npm', 'pnpm', 'yarn', 'bun'])
    expect(v[1].command).toBe('pnpm add -g productarena')
    expect(v[3].command).toBe('bun add -g productarena')
  })

  it('derives local install variants', () => {
    expect(installVariants('npm install @stripe/agent-toolkit')[1].command).toBe('pnpm add @stripe/agent-toolkit')
  })

  it('derives dlx/bunx for npx commands', () => {
    const v = installVariants('npx -y @usebruno/cli --version')
    expect(v.find((x) => x.manager === 'bun')?.command).toBe('bunx @usebruno/cli --version')
  })

  it('derives uv/pipx for pip installs', () => {
    expect(installVariants('pip install aider-chat').map((x) => x.manager)).toEqual(['pip', 'uv', 'pipx'])
  })

  it('leaves unknown commands untouched as a single variant', () => {
    const v = installVariants('brew install stripe/stripe-cli/stripe')
    expect(v).toHaveLength(1)
    expect(v[0].command).toBe('brew install stripe/stripe-cli/stripe')
  })
})
