/* eslint-env node, browser, jasmine */
const { listRemotes } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('listRemotes', () => {
  it('listRemotes', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-listRemotes')
    // Test
    const a = await listRemotes({ fs, dir, gitdir })
    expect(a).toEqual([
      { remote: 'foo', url: 'git@github.com:foo/foo.git' },
      { remote: 'bar', url: 'git@github.com:bar/bar.git' },
    ])
  })
})
