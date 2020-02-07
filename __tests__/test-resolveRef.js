/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-resolveRef.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { resolveRef } = require('isomorphic-git')

describe('resolveRef', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'
    })
    expect(ref).toMatchSnapshot()
  })
  it('test-branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'origin/test-branch'
    })
    expect(ref).toMatchSnapshot()
  })
  it('config', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'config'
    })
    expect(ref).toMatchSnapshot()
  })
  it('test-tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'test-tag'
    })
    expect(ref).toMatchSnapshot()
  })
  it('HEAD', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'HEAD'
    })
    expect(ref).toMatchSnapshot()
  })
  it('HEAD depth', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    expect(ref).toMatchSnapshot()
  })
  it('packed-refs', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'v0.0.1'
    })
    expect(ref).toMatchSnapshot()
  })
  it('non-existant refs', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let error = {}
    try {
      await resolveRef({
        fs,
        gitdir,
        ref: 'this-is-not-a-ref'
      })
    } catch (err) {
      error = err
    }
    expect(error.message).toBeDefined()
    expect(error.caller).toEqual('git.resolveRef')
  })
})
