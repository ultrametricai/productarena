// Derives equivalent install commands across package managers from a single curated command.
// Only transforms patterns it fully understands — anything else returns just the original,
// because a guessed install command that doesn't work is worse than one tab.
//
// The bar for a derivation living here: it must be MECHANICAL and always-correct — a pure
// rewrite of the same package spec into a manager that is argument-compatible by design.
// What qualifies, and why:
//
//   npm install [-g] <pkgs>  → pnpm add / yarn (global) add / bun add — all four resolve the
//                              identical npm-registry spec; only the verb differs.
//                            → deno add npm:<pkg> (local only) — Deno 2 consumes npm specs
//                              verbatim behind the npm: prefix.
//   npx <cmd …args>          → pnpm dlx / bunx — same registry, same bin resolution, args pass
//                              through untouched. (No yarn tab: `yarn dlx` is Berry-only and
//                              silently fails on classic yarn.)
//   pip install <args>       → uv pip install <args> — uv pip is a drop-in, flag-compatible pip
//                              replacement, so even flagged commands (-U, extras, pins) carry
//                              over verbatim. `python -m pip` and pip3 spellings normalize here
//                              too.
//   pip install <pkgs>       → pipx install <pkgs> — only when the args are bare package specs:
//                              pipx's flags are NOT pip's, so a flagged pip command is dropped
//                              from the pipx tab rather than mangled.
//   uv tool install <pkgs>  ⇄  pipx install <pkgs> — the same "install a Python app into an
//                              isolated venv" operation on both sides, including pip-style
//                              specs like git+https URLs and extras.
//   cargo install <pkgs>     → cargo binstall <pkgs> — binstall accepts crate specs verbatim
//                              and falls back to `cargo install` semantics when no prebuilt
//                              binary exists.
//
// Everything else is CURATION, not derivation — do not add it here, add a second entry to the
// product's install list instead:
//
//   brew            — formula/cask names are per-tap curation; no other manager installs a brew
//                     formula, and mapping "the npm CLI also ships a brew formula" is a fact
//                     about the product, not a rewrite of the command.
//   gem / go install / composer — each is the single canonical installer for its ecosystem;
//                     there is no second manager that accepts the same spec.
//   apt / dnf / pacman / apk — package names differ per distro repo; any pairing is a lookup
//                     table someone has to verify, i.e. curation.
//   docker run / curl|sh installers — vendor-specific by construction.
//   npm create <template> — pnpm/yarn/bun "create" exists but template resolution and
//                     version-tag semantics differ subtly per manager; close is not correct.
//   deno global installs — `deno install` needs permission flags (-A, --allow-net, …), and
//                     choosing a permission set is a security decision, never mechanical.
//   Flagged npm/pip commands — flags are manager-specific (`npm i rdme --save-dev` is
//                     `yarn add rdme --dev`), so flagged commands keep only the tabs whose
//                     flag surface is verbatim-compatible (uv pip) and skip the rest.
export interface InstallVariant {
  manager: string
  command: string
}

const NPM_GLOBAL = /^npm\s+(?:install|i|add)\s+(?:-g|--global)\s+(.+)$/
const NPM_LOCAL = /^npm\s+(?:install|i|add)\s+(?!-)(.+)$/
const NPX = /^npx\s+(?:-y\s+)?(.+)$/
const PIP = /^(?:pip3?|python3?\s+-m\s+pip)\s+install\s+(.+)$/
const UV_TOOL = /^uv\s+tool\s+install\s+(.+)$/
const PIPX = /^pipx\s+install\s+(.+)$/
const CARGO = /^cargo\s+install\s+(.+)$/

// True when any argument token is a flag — the signal that a command stopped being a plain
// package list and derivations must be conservative (see module comment).
function hasFlags(args: string): boolean {
  return args.split(/\s+/).some((t) => t.startsWith('-'))
}

export function installVariants(command: string): InstallVariant[] {
  const c = command.trim()
  const original: InstallVariant[] = [{ manager: '', command: c }]

  let m = c.match(NPM_GLOBAL)
  if (m) {
    const pkg = m[1]
    if (hasFlags(pkg)) return original
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
    if (hasFlags(pkg)) return original
    const denoSpecs = pkg.split(/\s+/).map((p) => `npm:${p}`).join(' ')
    return [
      { manager: 'npm', command: c },
      { manager: 'pnpm', command: `pnpm add ${pkg}` },
      { manager: 'yarn', command: `yarn add ${pkg}` },
      { manager: 'bun', command: `bun add ${pkg}` },
      { manager: 'deno', command: `deno add ${denoSpecs}` },
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
    const args = m[1]
    const variants: InstallVariant[] = [
      { manager: 'pip', command: c },
      { manager: 'uv', command: `uv pip install ${args}` },
    ]
    if (!hasFlags(args)) variants.push({ manager: 'pipx', command: `pipx install ${args}` })
    return variants
  }
  m = c.match(UV_TOOL)
  if (m) {
    const args = m[1]
    if (hasFlags(args)) return original
    return [
      { manager: 'uv', command: c },
      { manager: 'pipx', command: `pipx install ${args}` },
    ]
  }
  m = c.match(PIPX)
  if (m) {
    const args = m[1]
    if (hasFlags(args)) return original
    return [
      { manager: 'pipx', command: c },
      { manager: 'uv', command: `uv tool install ${args}` },
    ]
  }
  m = c.match(CARGO)
  if (m) {
    const args = m[1]
    if (hasFlags(args)) return original
    return [
      { manager: 'cargo', command: c },
      { manager: 'binstall', command: `cargo binstall ${args}` },
    ]
  }
  return original
}
