/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { managers } = require('isomorphic-git/internal-apis')
const { GitRefManager } = managers

describe('GitRefManager', () => {
  it('packedRefs', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.packedRefs({
      fs,
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })
  it('listRefs', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
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
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
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
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listTags({
      fs,
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })
})
