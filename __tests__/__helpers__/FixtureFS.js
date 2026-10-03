/* eslint-env node, browser, jasmine, jest */

import { makeLightningFS } from './FixtureFS/makeLightningFS.js'
import { makeNodeFixture } from './FixtureFS/makeNodeFixture.js'
import { makeZenFS } from './FixtureFS/makeZenFS.js'

if (globalThis.jest) {
  jest.useFakeTimers()
  jest.setTimeout(60_000)
}

// High enough to cover the per-spec retry wrapper (installSpecRetry): up to 3
// attempts × ~75s each. The wrapper's own per-attempt timeout is what actually
// fails a stuck spec; this is just the ceiling so jasmine doesn't kill a spec
// that is legitimately retrying.
if (globalThis.jasmine) jasmine.DEFAULT_TIMEOUT_INTERVAL = 240000

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
