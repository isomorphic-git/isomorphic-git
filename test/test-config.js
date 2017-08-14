import test from 'ava'
import git from '../lib'
import {exists, tmpdir, cleanup} from './_helpers'

test.skip(async t => {
  let conf = git('.').config()
  let sym = await conf.get('core.symlinks')
  let rfv = await conf.get('core.repositoryformatversion')
  let url = await conf.get('remote "origin".url')
  t.is(sym, false)
  t.is(rfv, '0')
  t.is(url, 'https://github.com/wmhilton/esgit')
})