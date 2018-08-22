/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-checkout.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const pify = require('pify')

const { plugins, checkout, listFiles } = require('isomorphic-git')

describe('checkout', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('checkout', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    plugins.set('fs', fs)
    await checkout({ dir, gitdir, ref: 'test-branch' })
    let files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
  })

  it('checkout by SHA', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    plugins.set('fs', fs)
    await checkout({
      dir,
      gitdir,
      ref: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
    })
    let files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
  })

  it('checkout unfetched branch', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    plugins.set('fs', fs)
    let error = null
    try {
      await checkout({ dir, gitdir, ref: 'missing-branch' })
      throw new Error('Checkout should have failed.')
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
    expect(error.caller).toEqual('git.checkout')
  })
})
