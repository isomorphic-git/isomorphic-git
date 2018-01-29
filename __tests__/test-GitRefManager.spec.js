/* global describe it expect */
const pify = require('pify')
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { managers } = require('../dist/for-node/internal-apis')
const { GitRefManager } = managers

describe('GitRefManager', () => {
  beforeAll(() => {
    registerSnapshots(require('./test-GitRefManager.snap'), 'GitRefManager')
  })
  it('packedRefs', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.packedRefs({
      fs,
      gitdir
    })
    expectjs([...refs]).toMatchSnapshot()
  })
  it('listRefs', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/remotes/origin'
    })
    expectjs(refs).toMatchSnapshot()
    refs = await GitRefManager.listRefs({
      fs,
      gitdir,
      filepath: 'refs/tags'
    })
    expectjs(refs).toMatchSnapshot()
  })
  it('listBranches', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listBranches({
      fs,
      gitdir
    })
    expectjs(refs).toMatchSnapshot()
    refs = await GitRefManager.listBranches({
      fs,
      gitdir,
      remote: 'origin'
    })
    expectjs(refs).toMatchSnapshot()
  })
  it('listTags', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitRefManager')
    let refs = await GitRefManager.listTags({
      fs,
      gitdir
    })
    expectjs(refs).toMatchSnapshot()
  })
})
