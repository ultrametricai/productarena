// Derives equivalent install commands across package managers from a single curated command.
// Only transforms patterns it fully understands — anything else returns just the original,
// because a guessed install command that doesn't work is worse than one tab.
export interface InstallVariant {
  manager: string
  command: string
}

const NPM_GLOBAL = /^npm\s+(?:install|i)\s+(-g|--global)\s+(.+)$/
const NPM_LOCAL = /^npm\s+(?:install|i)\s+(?!-)(.+)$/
const NPX = /^npx\s+(?:-y\s+)?(.+)$/
const PIP = /^pip3?\s+install\s+(.+)$/

export function installVariants(command: string): InstallVariant[] {
  const c = command.trim()
  let m = c.match(NPM_GLOBAL)
  if (m) {
    const pkg = m[2]
    return [
      { manager: 'npm', command: c },
      { manager: 'pnpm', command: `pnpm add -g ${pkg}` },
      { manager: 'yarn', command: `yarn global add ${pkg}` },
      { manager: 'bun', command: `bun add -g ${pkg}` },
    ]
  }
  m = c.match(NPM_LOCAL)
  if (m) {
    const pkg = m[1]
    return [
      { manager: 'npm', command: c },
      { manager: 'pnpm', command: `pnpm add ${pkg}` },
      { manager: 'yarn', command: `yarn add ${pkg}` },
      { manager: 'bun', command: `bun add ${pkg}` },
    ]
  }
  m = c.match(NPX)
  if (m) {
    const rest = m[1]
    return [
      { manager: 'npx', command: c },
      { manager: 'pnpm', command: `pnpm dlx ${rest}` },
      { manager: 'bun', command: `bunx ${rest}` },
    ]
  }
  m = c.match(PIP)
  if (m) {
    const pkg = m[1]
    return [
      { manager: 'pip', command: c },
      { manager: 'uv', command: `uv pip install ${pkg}` },
      { manager: 'pipx', command: `pipx install ${pkg}` },
    ]
  }
  return [{ manager: '', command: c }]
}
