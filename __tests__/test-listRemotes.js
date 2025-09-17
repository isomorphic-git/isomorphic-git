/* eslint-env node, browser, jasmine */
import { listRemotes } from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

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
