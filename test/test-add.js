import test from 'ava'
import git from '../lib'
import read from '../lib/utils/read'
import GitIndexManager from '../lib/managers/GitIndexManager'
import {tmpdir, cleanup} from './_helpers'

test('gitIndex.add', async t => {
  const repo = git('test/fixtures/test-add')
  await repo.add('a.txt')
  const index = await GitIndexManager.acquire('test/fixtures/test-add/.git/index')
  t.true(index.entries.length == 1)
  console.log(index.entries)
})