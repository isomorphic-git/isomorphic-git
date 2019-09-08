/* eslint-env node, browser, jasmine */

const { makeLightningFS } = require('./FixtureFS/makeLightningFS.js')
const { makeNodeFixture } = require('./FixtureFS/makeNodeFixture.js')
const setTestTimeout = require('./set-test-timeout')
setTestTimeout(60000)

async function makeFixture (dir) {
  return process.browser ? makeLightningFS(dir) : makeNodeFixture(dir)
}

module.exports.makeFixture = makeFixture
