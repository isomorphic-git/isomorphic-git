/* eslint-env node, browser, jasmine, jest */

import { makeLightningFS } from './FixtureFS/makeLightningFS.js'
import { makeNodeFixture } from './FixtureFS/makeNodeFixture.js'
import { makeZenFS } from './FixtureFS/makeZenFS.js'
import setTestTimeout from './set-test-timeout'

globalThis?.jest?.useFakeTimers()
setTestTimeout(60000)

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
