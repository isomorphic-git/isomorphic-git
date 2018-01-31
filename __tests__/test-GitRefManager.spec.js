/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { assertSnapshot } = require('./__helpers__/assertSnapshot')
const snapshots = require('./__snapshots__/test-GitRefManager.js.snap')
const pify = require('pify')
const { managers } = require('../dist/for-node/internal-apis')
const { GitRefManager } = managers

describe('GitRefManager', () => {
  it('packedRefs', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.packedRefs({
      fs,
      gitdir
    })
    assertSnapshot(refs, snapshots, `GitRefManager packedRefs 1`)
  })
  it('listRefs', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/remotes/origin'
    })
    assertSnapshot(refs, snapshots, `GitRefManager listRefs 1`)
    refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/tags'
    })
    assertSnapshot(refs, snapshots, `GitRefManager listRefs 2`)
  })
  it('listBranches', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listBranches({
      fs,
      gitdir
    })
    assertSnapshot(refs, snapshots, `GitRefManager listBranches 1`)
    refs = await GitRefManager.listBranches({
      fs,
      gitdir,
      remote: 'origin'
    })
    assertSnapshot(refs, snapshots, `GitRefManager listBranches 2`)
  })
  it('listTags', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listTags({
      fs,
      gitdir
    })
    assertSnapshot(refs, snapshots, `GitRefManager listTags 1`)
  })
})
