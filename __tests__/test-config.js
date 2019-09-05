/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { config } = require('isomorphic-git')

describe('config', () => {
  it('getting', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-config')
    // Test
    const sym = await config({ gitdir, path: 'core.symlinks' })
    const rfv = await config({ gitdir, path: 'core.repositoryformatversion' })
    const url = await config({ gitdir, path: 'remote.origin.url' })
    const fetch = await config({ gitdir, path: 'remote.upstream.fetch' })
    const fetches = await config({
      gitdir,
      path: 'remote.upstream.fetch',
      all: true
    })
    expect(sym).toBe(false)
    expect(url).toBe('https://github.com/isomorphic-git/isomorphic-git')
    expect(rfv).toBe('0')
    expect(fetch).toBe('refs/heads/qa/*:refs/remotes/upstream/qa/*')
    expect(fetches).toEqual([
      '+refs/heads/master:refs/remotes/upstream/master',
      'refs/heads/develop:refs/remotes/upstream/develop',
      'refs/heads/qa/*:refs/remotes/upstream/qa/*'
    ])
  })

  it('setting', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-config')
    // Test
    let bare
    // set to true
    await config({ gitdir, path: 'core.bare', value: true })
    bare = await config({ gitdir, path: 'core.bare' })
    expect(bare).toBe(true)
    // set to false
    await config({ gitdir, path: 'core.bare', value: false })
    bare = await config({ gitdir, path: 'core.bare' })
    expect(bare).toBe(false)
    // set to undefined
    await config({ gitdir, path: 'core.bare', value: undefined })
    bare = await config({ gitdir, path: 'core.bare' })
    expect(bare).toBe(undefined)
    // change a remote
    await config({
      gitdir,
      path: 'remote.origin.url',
      value: 'https://github.com/isomorphic-git/isomorphic-git'
    })
    const url = await config({ gitdir, path: 'remote.origin.url' })
    expect(url).toBe('https://github.com/isomorphic-git/isomorphic-git')
  })
})
