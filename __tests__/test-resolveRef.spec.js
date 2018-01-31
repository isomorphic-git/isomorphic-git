/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { assertSnapshot } = require('./__helpers__/assertSnapshot')
const snapshots = require('./__snapshots__/test-resolveRef.js.snap')
const { resolveRef } = require('..')

describe('resolveRef', () => {
  it('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let ref = await resolveRef({
      fs,
      gitdir,
      ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'
    })
    assertSnapshot(
      ref,
      snapshots,
      `resolveRef 1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9 1`
    )
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
    assertSnapshot(ref, snapshots, `resolveRef test-branch 1`)
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
    assertSnapshot(ref, snapshots, `resolveRef test-tag 1`)
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
    assertSnapshot(ref, snapshots, `resolveRef HEAD 1`)
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
    assertSnapshot(ref, snapshots, `resolveRef HEAD depth 1`)
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
    assertSnapshot(ref, snapshots, `resolveRef packed-refs 1`)
  })
})
