import test from 'ava'
import git from '../lib'
import GitIndexManager from '../lib/managers/GitIndexManager'

test('gitIndex.remove(file)', async t => {
  const repo = git('test/fixtures/esgit.git')
  let orig = (await repo.list()).length
  await repo.remove('README.md')
  t.true(orig === (await repo.list()).length + 1)
})

test('gitIndex.remove(dir)', async t => {
  const repo = git('test/fixtures/esgit.git')
  let orig = (await repo.list()).length
  await repo.remove('test')
  t.true(orig === (await repo.list()).length + 7)
})