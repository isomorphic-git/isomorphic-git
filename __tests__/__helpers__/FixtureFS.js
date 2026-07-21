/* eslint-env node, browser, jasmine, jest */

import { makeLightningFS } from './FixtureFS/makeLightningFS.js'
import { makeNodeFixture } from './FixtureFS/makeNodeFixture.js'
import { makeZenFS, resetZenFS } from './FixtureFS/makeZenFS.js'

if (globalThis.jest) {
  jest.useFakeTimers()
  jest.setTimeout(60_000)
}

if (globalThis.jasmine) jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

// In the browser, give each test a fresh ZenFS writable overlay on top of the
// shared (cached) read-only fixtures. This isolates tests from each other while
// letting several makeFixture() calls within a single test share one filesystem.
// Skipped when LightningFS is explicitly selected, since it manages its own fs.
if (
  typeof process !== 'undefined' &&
  process.browser &&
  !process.env.ENABLE_LIGHTNINGFS &&
  globalThis.jasmine
) {
  beforeEach(async () => {
    await resetZenFS()
  })
}

export async function makeFixture(dir) {
  return process.browser ? makeBrowserFixture(dir) : makeNodeFixture(dir)
}

async function makeBrowserFixture(dir) {
  // enable / disable console.log statements
  // window.localStorage.debug = 'isomorphic-git'
  const isSafari = /Safari/.test(navigator && navigator.userAgent)
  return process.env.ENABLE_LIGHTNINGFS && !isSafari
    ? makeLightningFS(dir)
    : makeZenFS(dir)
}
