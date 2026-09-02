// Global Vitest setup: auto-unmount every React Testing Library render() between tests. Without
// this, multiple `render()` calls within one test file accumulate DOM nodes (jsdom persists
// across tests in the same file), causing spurious "found multiple elements" failures in any
// test file with more than one render() call. Safe to run for non-jsdom (pure lib) test files
// too — cleanup() no-ops when there's nothing mounted.
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
