import test from 'ava'
import git from '../lib'

// TODO: Use lockfiles and whatever so we stop getting
// race conditions and can remove the .serial hack

test.serial('getConfig', async t => {
  let repo = git().gitdir('fixtures/test-config.git')
  let sym = await repo.getConfig('core.symlinks')
  let rfv = await repo.getConfig('core.repositoryformatversion')
  let url = await repo.getConfig('remote "origin".url')
  t.is(sym, false)
  t.is(url, 'https://github.com/wmhilton/esgit')
  t.is(rfv, '0')
})

test.serial('setConfig', async t => {
  let repo = git().gitdir('fixtures/test-config.git')
  let bare
  // set to true
  await repo.setConfig('core.bare', true)
  bare = await repo.getConfig('core.bare')
  t.is(bare, true)
  // set to false
  await repo.setConfig('core.bare', false)
  bare = await repo.getConfig('core.bare')
  t.is(bare, false)
})
