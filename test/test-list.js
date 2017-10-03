import test from 'ava'
import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir } from './_helpers'

test('gitIndex.list', async t => {
  let dir = await tmpdir()
  await pify(ncp)('fixtures/test-list.git', dir)
  const files = await git()
    .gitdir(dir)
    .list()
  t.snapshot(files)
})
