/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-GitRefManager.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { GitRefManager } = require('isomorphic-git/internal-apis')

describe('GitRefManager', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('packedRefs', async () => {
    let { fs, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.packedRefs({
      fs,
      gitdir
    })
    expect([...refs]).toMatchSnapshot()
  })
  it('listRefs', async () => {
    let { fs, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/remotes/origin'
    })
    expect(refs).toMatchSnapshot()
    refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/tags'
    })
    expect(refs).toMatchSnapshot()
  })
  it('listBranches', async () => {
    let { fs, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listBranches({
      fs,
      gitdir
    })
    expect(refs).toMatchSnapshot()
    refs = await GitRefManager.listBranches({
      fs,
      gitdir,
      remote: 'origin'
    })
    expect(refs).toMatchSnapshot()
  })
  it('listTags', async () => {
    let { fs, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listTags({
      fs,
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })
})
