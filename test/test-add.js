import test from 'ava'
import git from '..'
import { rm } from '../lib/utils/delete'

test.beforeEach(async t => {
  await rm('fixtures/test-add/.git/index')
})

test('gitIndex.add(file)', async t => {
  const repo = git('fixtures/test-add')
  await repo.init()
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
