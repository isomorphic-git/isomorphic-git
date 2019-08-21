/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { merge, resolveRef } = require('isomorphic-git')

describe('merge', () => {
  it('merge master into master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'master',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge medium into master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'medium'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'medium',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge oldest into master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'oldest',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge newest into master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'newest'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeTruthy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge newest into master --dryRun', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const originalOid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'newest'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true,
      dryRun: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeTruthy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(originalOid)
  })
})
