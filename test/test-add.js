import test from 'ava'
import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir } from './helpers'

test('gitIndex.add(file)', async t => {
  // Setup
  let dir = await tmpdir()
  console.log('dir =', dir)
  await pify(ncp)('test/fixtures/test-add', dir)
  // Test
  const repo = git(dir)
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
