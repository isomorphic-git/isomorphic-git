import test from 'ava'
import git from '../lib'
import read from '../lib/utils/read'
import {tmpdir, cleanup} from './_helpers'

test('gitIndex.list', async t => {
  const files = await git('test/fixtures/esgit').list()
  t.snapshot(files)
})