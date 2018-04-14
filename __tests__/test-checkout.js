/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-checkout.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const pify = require('pify')

const { checkout, listFiles } = require('isomorphic-git')

describe('checkout', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('checkout', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({ fs, dir, gitdir, ref: 'test-branch' })
    let files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchSnapshot()
  })

  it('checkout unfetched branch', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    try {
      await checkout({ fs, dir, gitdir, ref: 'missing-branch' })
      throw new Error('Checkout should have failed.')
    } catch (err) {
      expect(err.message).toMatchSnapshot()
    }
  })

  it('checkout over an existing branch', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture(
      'test-checkout-overwrite-working-dir'
    )
    // This should be a no-op since branch-a is already checked out
    await checkout({ fs, dir, gitdir, ref: 'branch-a' })
    let files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchSnapshot()
    // This should result in a.txt, b.txt, c.txt, d.txt
    await checkout({ fs, dir, gitdir, ref: 'branch-b' })
    files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchSnapshot()
    // For good measure, lets switch back to branch-a. Two tests for the price of one.
    await checkout({ fs, dir, gitdir, ref: 'branch-a' })
    files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchSnapshot()
  })
})
