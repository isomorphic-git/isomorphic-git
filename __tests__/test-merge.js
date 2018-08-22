/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { plugins, merge, resolveRef } = require('isomorphic-git')

describe('merge', () => {
  it('merge master into master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-merge')
    plugins.set('fs', fs)
    // Test
    let desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'master'
    })
    let m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'master',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    let oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })
  it('merge medium into master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-merge')
    plugins.set('fs', fs)
    // Test
    let desiredOid = await resolveRef({
      gitdir,
      ref: 'medium'
    })
    let m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'medium',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    let oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })
  it('merge oldest into master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-merge')
    plugins.set('fs', fs)
    // Test
    let desiredOid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    let m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'oldest',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    let oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })
  it('merge newest into master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-merge')
    plugins.set('fs', fs)
    // Test
    let desiredOid = await resolveRef({
      gitdir,
      ref: 'newest'
    })
    let m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeTruthy()
    let oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })
})
