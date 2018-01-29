/* globals describe it expect */
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const pify = require('pify')
const { checkout, listFiles } = require('..')

describe('checkout', () => {
  beforeAll(() => {
    registerSnapshots(require('./test-checkout.snap'), 'checkout')
  })

  it('checkout', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({ fs, dir, gitdir, ref: 'test-branch' })
    let files = await pify(fs.readdir)(dir)
    expectjs(files.sort()).toMatchSnapshot()
    let index = await listFiles({ fs, dir, gitdir })
    expectjs(index).toMatchSnapshot()
  })
})
