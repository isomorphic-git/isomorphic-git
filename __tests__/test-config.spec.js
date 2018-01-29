/* globals jest describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { config } = require('..')

describe('config', () => {
  it('getting', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-config')
    // Test
    let sym = await config({ fs, gitdir, path: 'core.symlinks' })
    let rfv = await config({ fs, gitdir, path: 'core.repositoryformatversion' })
    let url = await config({ fs, gitdir, path: 'remote.origin.url' })
    expect(sym).toBe(false)
    expect(url).toBe('https://github.com/isomorphic-git/isomorphic-git')
    expect(rfv).toBe('0')
  })

  it('setting', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-config')
    // Test
    let bare
    // set to true
    await config({ fs, gitdir, path: 'core.bare', value: true })
    bare = await config({ fs, gitdir, path: 'core.bare' })
    expect(bare).toBe(true)
    // set to false
    await config({ fs, gitdir, path: 'core.bare', value: false })
    bare = await config({ fs, gitdir, path: 'core.bare' })
    expect(bare).toBe(false)
    // set to undefined
    await config({ fs, gitdir, path: 'core.bare', value: undefined })
    bare = await config({ fs, gitdir, path: 'core.bare' })
    expect(bare).toBe(undefined)
    // change a remote
    await config({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: 'https://github.com/isomorphic-git/isomorphic-git'
    })
    let url = await config({ fs, gitdir, path: 'remote.origin.url' })
    expect(url).toBe('https://github.com/isomorphic-git/isomorphic-git')
  })
})
