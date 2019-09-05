/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listRemotes } = require('isomorphic-git')

describe('listRemotes', () => {
  it('listRemotes', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-listRemotes')
    // Test
    const a = await listRemotes({ dir, gitdir })
    expect(a).toEqual([
      { remote: 'foo', url: 'git@github.com:foo/foo.git' },
      { remote: 'bar', url: 'git@github.com:bar/bar.git' }
    ])
  })
})
