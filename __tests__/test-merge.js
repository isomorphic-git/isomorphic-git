/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { merge, resolveRef } = require('isomorphic-git')

describe('merge', () => {
  it('merge master into master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-merge')
    // Test
    let desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'master'
    })
    await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'master',
      fastForwardOnly: true
    })
    let oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })
  it('merge medium into master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-merge')
    // Test
    let desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'medium'
    })
    await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'medium',
      fastForwardOnly: true
    })
    let oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })
  it('merge oldest into master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-merge')
    // Test
    let desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'master'
    })
    await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'oldest',
      fastForwardOnly: true
    })
    let oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })
  it('merge newest into master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-merge')
    // Test
    let desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'newest'
    })
    await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true
    })
    let oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })
})
