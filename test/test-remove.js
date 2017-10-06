import test from 'ava'
import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir } from './helpers'

test('remove(file)', async t => {
  // Setup
  let clientDir = await tmpdir()
  await pify(ncp)('test/fixtures/test-remove.git', clientDir)
  // Test
  const repo = git().gitdir(clientDir)
  let before = await repo.list()
  t.snapshot(before)
  await repo.remove('LICENSE.md')
  let after = await repo.list()
  t.snapshot(after)
  t.true(before.length === after.length + 1)
})

test('remove(dir)', async t => {
  // Setup
  let clientDir = await tmpdir()
  await pify(ncp)('test/fixtures/test-remove.git', clientDir)
  // Test
  const repo = git().gitdir(clientDir)
  let before = await repo.list()
  t.snapshot(before)
  await repo.remove('src/models')
  let after = await repo.list()
  t.snapshot(after)
  t.true(before.length === after.length + 5)
})
