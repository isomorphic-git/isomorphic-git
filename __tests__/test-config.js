import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir, exists } from './__helpers__'

describe('config', () => {
  test('getConfig', async () => {
    // Setup
    let clientDir = await tmpdir()
    await pify(ncp)('__tests__/__fixtures__/test-config.git', clientDir)
    // Test
    let repo = git().gitdir(clientDir)
    let sym = await repo.getConfig('core.symlinks')
    let rfv = await repo.getConfig('core.repositoryformatversion')
    let url = await repo.getConfig('remote.origin.url')
    expect(sym).toBe(false)
    expect(url).toBe('https://github.com/wmhilton/isomorphic-git')
    expect(rfv).toBe('0')
  })

  test('setConfig', async () => {
    // Setup
    let clientDir = await tmpdir()
    await pify(ncp)('__tests__/__fixtures__/test-config.git', clientDir)
    // Test
    let repo = git().gitdir(clientDir)
    let bare
    // set to true
    await repo.setConfig('core.bare', true)
    bare = await repo.getConfig('core.bare')
    expect(bare).toBe(true)
    // set to false
    await repo.setConfig('core.bare', false)
    bare = await repo.getConfig('core.bare')
    expect(bare).toBe(false)
    // change a remote
    await repo.setConfig(
      'remote.origin.url',
      'https://github.com/wmhilton/isomorphic-git'
    )
    let url = await repo.getConfig('remote.origin.url')
    expect(url).toBe('https://github.com/wmhilton/isomorphic-git')
  })
})
