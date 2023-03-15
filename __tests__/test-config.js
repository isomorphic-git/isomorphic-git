/* eslint-env node, browser, jasmine */
const { getConfig, getConfigAll, setConfig } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('config', () => {
  it('getting', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-config')
    // Test
    const sym = await getConfig({ fs, gitdir, path: 'core.symlinks' })
    const rfv = await getConfig({
      fs,
      gitdir,
      path: 'core.repositoryformatversion',
    })
    const url = await getConfig({ fs, gitdir, path: 'remote.origin.url' })
    const fetch = await getConfig({ fs, gitdir, path: 'remote.upstream.fetch' })
    const fetches = await getConfigAll({
      fs,
      gitdir,
      path: 'remote.upstream.fetch',
    })
    expect(sym).toBe(false)
    expect(url).toBe('https://github.com/isomorphic-git/isomorphic-git')
    expect(rfv).toBe('0')
    expect(fetch).toBe('refs/heads/qa/*:refs/remotes/upstream/qa/*')
    expect(fetches).toEqual([
      '+refs/heads/master:refs/remotes/upstream/master',
      'refs/heads/develop:refs/remotes/upstream/develop',
      'refs/heads/qa/*:refs/remotes/upstream/qa/*',
    ])
  })

  it('setting', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-config')
    // Test
    let bare
    // set to true
    await setConfig({ fs, gitdir, path: 'core.bare', value: true })
    bare = await getConfig({ fs, gitdir, path: 'core.bare' })
    expect(bare).toBe(true)
    // set to false
    await setConfig({ fs, gitdir, path: 'core.bare', value: false })
    bare = await getConfig({ fs, gitdir, path: 'core.bare' })
    expect(bare).toBe(false)
    // set to undefined
    await setConfig({ fs, gitdir, path: 'core.bare', value: undefined })
    bare = await getConfig({ fs, gitdir, path: 'core.bare' })
    expect(bare).toBe(undefined)
    // change a remote
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: 'https://github.com/isomorphic-git/isomorphic-git',
    })
    const url = await getConfig({ fs, gitdir, path: 'remote.origin.url' })
    expect(url).toBe('https://github.com/isomorphic-git/isomorphic-git')
  })
})
