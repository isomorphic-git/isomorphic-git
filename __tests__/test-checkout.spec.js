/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const prettyFormat = require('pretty-format')
const snapshots = require('./__snapshots__/test-checkout.js.snap')
const { assertSnapshot } = require('./__helpers__/assertSnapshot')

const pify = require('pify')
const { checkout, listFiles } = require('..')

describe('checkout', () => {
  it('checkout', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({ fs, dir, gitdir, ref: 'test-branch' })
    let files = await pify(fs.readdir)(dir)
    assertSnapshot(files.sort(), snapshots, `checkout checkout 1`)
    let index = await listFiles({ fs, dir, gitdir })
    assertSnapshot(index, snapshots, `checkout checkout 2`)
  })
})
