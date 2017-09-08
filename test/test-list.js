import test from 'ava'
import git from '../lib'
import read from '../lib/utils/read'
import write from '../lib/utils/write'
import {tmpdir, cleanup} from './_helpers'

test.beforeEach(async t => {
  await write('fixtures/esgit.git/index', await read('fixtures/esgit.git/index.orig'))
})

test.serial('gitIndex.list', async t => {
  const files = await git().gitdir('fixtures/esgit.git').list()
  t.snapshot(files)
})