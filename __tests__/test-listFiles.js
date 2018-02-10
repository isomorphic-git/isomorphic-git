/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { listFiles } = require('isomorphic-git')

describe('listFiles', () => {
  it('listFiles', async () => {
    let { fs, gitdir } = await makeFixture('test-listFiles')
    const files = await listFiles({ fs, gitdir })
    expect(files).toMatchSnapshot()
  })
})
