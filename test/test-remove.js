import test from 'ava'
import git from '../lib'
import GitIndexManager from '../lib/managers/GitIndexManager'
import read from '../lib/utils/read'
import write from '../lib/utils/write'

test.beforeEach(async t => {
  await write('test/fixtures/esgit.git/index', await read('test/fixtures/esgit.git/backup.index'))
})

test.serial('gitIndex.remove(file)', async t => {
  const repo = git('test/fixtures/esgit.git')
  let orig = (await repo.list()).length
  await repo.remove('README.md')
  t.true(orig === (await repo.list()).length + 1)
})

test.serial('gitIndex.remove(dir)', async t => {
  const repo = git('test/fixtures/esgit.git')
  let orig = (await repo.list()).length
  await repo.remove('test')
  t.true(orig === (await repo.list()).length + 7)
})