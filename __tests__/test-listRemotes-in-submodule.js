/* eslint-env node, browser, jasmine */
const { listRemotes } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('listRemotes', () => {
  ;(process.browser ? xit : it)('listRemotes', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-listRemotes')
    // Test
    const a = await listRemotes({ fs, dir, gitdir })
    expect(a).toEqual([
      { remote: 'foo', url: 'git@github.com:foo/foo.git' },
      { remote: 'bar', url: 'git@github.com:bar/bar.git' },
    ])
  })
})
