/* eslint-env node, browser, jasmine */

const { makeBrowserFS } = require('./FixtureFS/makeBrowserFS.js')
const { makeLightningFS } = require('./FixtureFS/makeLightningFS.js')
const { makeNodeFixture } = require('./FixtureFS/makeNodeFixture.js')
const setTestTimeout = require('./set-test-timeout')
setTestTimeout(60000)

async function makeFixture(dir) {
  return process.browser ? makeBrowserFixture(dir) : makeNodeFixture(dir)
}

async function makeBrowserFixture(dir) {
  // enable / disable console.log statements
  // window.localStorage.debug = 'isomorphic-git'
  const isSafari = /Safari/.test(navigator && navigator.userAgent)
  return process.env.ENABLE_LIGHTNINGFS && !isSafari
    ? makeLightningFS(dir)
    : makeBrowserFS(dir)
}

module.exports.makeFixture = makeFixture
