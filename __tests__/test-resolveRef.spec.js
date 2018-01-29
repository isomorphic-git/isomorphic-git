/* global describe it expect */
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { resolveRef } = require('..')

describe('resolveRef', () => {
  beforeAll(() => {
    registerSnapshots(require('./test-resolveRef.snap'), 'resolveRef')
  })
  it('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let ref = await resolveRef({
      fs,
      gitdir,
      ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'
    })
    expectjs(ref).toMatchSnapshot()
  })
  it('test-branch', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let ref = await resolveRef({
      fs,
      gitdir,
      ref: 'origin/test-branch'
    })
    expectjs(ref).toMatchSnapshot()
  })
  it('test-tag', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let ref = await resolveRef({
      fs,
      gitdir,
      ref: 'test-tag'
    })
    expectjs(ref).toMatchSnapshot()
  })
  it('HEAD', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let ref = await resolveRef({
      fs,
      gitdir,
      ref: 'HEAD'
    })
    expectjs(ref).toMatchSnapshot()
  })
  it('HEAD depth', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let ref = await resolveRef({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    expectjs(ref).toMatchSnapshot()
  })
  it('packed-refs', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let ref = await resolveRef({
      fs,
      gitdir,
      ref: 'v0.0.1'
    })
    expectjs(ref).toMatchSnapshot()
  })
})
