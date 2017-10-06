import test from 'ava'
import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir } from './helpers'

test('gitIndex.list', async t => {
  let dir = await tmpdir()
  await pify(ncp)('test/fixtures/test-list.git', dir)
  const files = await git()
    .gitdir(dir)
    .list()
  t.snapshot(files)
})
