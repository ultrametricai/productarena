// typescript-eslint 8.x hard-fails at import time under the root typescript@7 devDependency
// ("typescript-eslint does not support TS 7.0" — the native/Go compiler has no JS API for
// typed linting; support is tracked in typescript-eslint/typescript-eslint#10940, and even
// 8.70.x still peers `typescript >=4.8.4 <6.1.0`). Microsoft's documented TS 7 story is to
// run typescript-eslint against a side-by-side TS 6.x install, so this hook gives ONLY the
// lint toolchain packages their own nested typescript@6.0.x dependency (replacing their
// `typescript` peer, which pnpm would otherwise satisfy with the root's 7.x). `tsc`,
// `next build`, and everything else keep resolving the root typescript@7.
//
// Broke on 2026-09 launch audit: every CI run failed in the Lint step after Renovate's
// typescript 6→7 bump. Drop this file (and the note in pnpm-workspace.yaml) once
// typescript-eslint's peer range accepts >=7, then `pnpm install` to refresh the lockfile.
const LINT_TS_VERSION = '6.0.3' // last JS-implemented TypeScript line; keep <6.1.0

const LINT_TS_PACKAGES = new Set([
  'typescript-eslint',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  '@typescript-eslint/project-service',
  '@typescript-eslint/tsconfig-utils',
  '@typescript-eslint/type-utils',
  '@typescript-eslint/typescript-estree',
  '@typescript-eslint/utils',
])

function readPackage(pkg) {
  if (LINT_TS_PACKAGES.has(pkg.name)) {
    if (pkg.peerDependencies) delete pkg.peerDependencies.typescript
    if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.typescript
    pkg.dependencies = { ...pkg.dependencies, typescript: LINT_TS_VERSION }
  }
  return pkg
}

module.exports = { hooks: { readPackage } }
