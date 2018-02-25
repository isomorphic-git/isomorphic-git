/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { listTags } = require('isomorphic-git')

describe('listTags', () => {
  it('listTags', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listTags')
    // Test
    let refs = await listTags({
      fs,
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })
})
