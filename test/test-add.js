import test from 'ava'
import git from '../lib'
import read from '../lib/utils/read'
import rm from '../lib/utils/delete'
import GitIndexManager from '../lib/managers/GitIndexManager'
import {tmpdir, cleanup} from './_helpers'

test.beforeEach(async t => {
  await rm('test/fixtures/test-add/.git/index')
})

test('gitIndex.add(file)', async t => {
  const repo = git('test/fixtures/test-add')
  let orig = (await repo.list()).length
  await repo.add('a.txt')
  t.true((await repo.list()).length === 1)
  await repo.add('a.txt')
  t.true((await repo.list()).length === 1)
  await repo.add('a-copy.txt')
  t.true((await repo.list()).length === 2)
  await repo.add('b.txt')
  t.true((await repo.list()).length === 3)
})
