/* eslint-env node, browser, jasmine */
const {makeFixture} = require('./__helpers__/FixtureFS.js')
const {addRemote, listRemotes} = require('isomorphic-git')

describe('addRemote', () => {
  it('addRemote', async () => {
    // Setup
    let {fs, dir, gitdir} = await makeFixture('test-addRemote')
    const remote = 'baz'
    const url = 'git@github.com:baz/baz.git'
    // Test
    await addRemote({fs, dir, gitdir, remote, url})
    const a = await listRemotes({fs, dir, gitdir})
    expect(a).toEqual([
      { remote: 'foo', url: 'git@github.com:foo/foo.git' },
      { remote: 'bar', url: 'git@github.com:bar/bar.git' },
      { remote: 'baz', url: 'git@github.com:baz/baz.git' }
    ])
  })
})
