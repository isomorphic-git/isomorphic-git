import test from 'ava'
import git from '../lib'
import { exists, tmpdir, cleanup } from './_helpers'

test(async t => {
  let repo = git().gitdir('fixtures/test-config.git')
  let sym = await repo.getConfig('core.symlinks')
  let rfv = await repo.getConfig('core.repositoryformatversion')
  let url = await repo.getConfig('remote "origin".url')
  t.is(sym, false)
  t.is(rfv, '0')
  t.is(url, 'https://github.com/wmhilton/esgit')
})
