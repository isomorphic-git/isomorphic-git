import test from 'ava'
import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir, exists } from './_helpers'

// TODO: Use lockfiles and whatever so we stop getting
// race conditions and can remove the .serial hack

test('getConfig', async t => {
  // Setup
  let clientDir = await tmpdir()
  await pify(ncp)('fixtures/test-config.git', clientDir)
  // Test
  let repo = git().gitdir(clientDir)
  let sym = await repo.getConfig('core.symlinks')
  let rfv = await repo.getConfig('core.repositoryformatversion')
  let url = await repo.getConfig('remote.origin.url')
  t.is(sym, false)
  t.is(url, 'https://github.com/wmhilton/esgit')
  t.is(rfv, '0')
})

test('setConfig', async t => {
  // Setup
  let clientDir = await tmpdir()
  await pify(ncp)('fixtures/test-config.git', clientDir)
  // Test
  let repo = git().gitdir(clientDir)
  let bare
  // set to true
  await repo.setConfig('core.bare', true)
  bare = await repo.getConfig('core.bare')
  t.is(bare, true)
  // set to false
  await repo.setConfig('core.bare', false)
  bare = await repo.getConfig('core.bare')
  t.is(bare, false)
  // change a remote
  await repo.setConfig(
    'remote.origin.url',
    'https://github.com/wmhilton/isomorphic-git'
  )
  let url = await repo.getConfig('remote.origin.url')
  t.is(url, 'https://github.com/wmhilton/isomorphic-git')
})
