/* global describe it expect */
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listTags } = require('..')

describe('listTags', () => {
  beforeAll(() => {
    registerSnapshots(require('./test-listTags.snap'), 'listTags')
  })
  it('listTags', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listTags')
    // Test
    let refs = await listTags({
      fs,
      gitdir
    })
    expectjs(refs).toMatchSnapshot()
  })
})
