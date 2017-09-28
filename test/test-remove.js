import test from 'ava'
import git from '..'
import { read, write } from '../lib/utils'

test.serial('gitIndex.remove(file)', async t => {
  await write(
    'fixtures/test-remove-file.git/index',
    await read('fixtures/test-remove-file.git/index.orig')
  )
  const repo = git().gitdir('fixtures/test-remove-file.git')
  let before = await repo.list()
  t.snapshot(before)
  await repo.remove('LICENSE.md')
  let after = await repo.list()
  t.snapshot(after)
  t.true(before.length === after.length + 1)
})

test.serial('gitIndex.remove(dir)', async t => {
  await write(
    'fixtures/test-remove-dir.git/index',
    await read('fixtures/test-remove-dir.git/index.orig')
  )
  const repo = git().gitdir('fixtures/test-remove-dir.git')
  let before = await repo.list()
  t.snapshot(before)
  await repo.remove('src/models')
  let after = await repo.list()
  t.snapshot(after)
  t.true(before.length === after.length + 5)
})
