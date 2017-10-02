import test from 'ava'
import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { read } from '../lib/utils'
import { tmpdir, exists } from './_helpers'

test('fetch (from Github)', async t => {
  // Setup
  let clientDir = await tmpdir()
  await pify(ncp)('fixtures/test-fetch.git', clientDir)
  // Test
  await git()
    .gitdir(clientDir)
    .remote('origin')
    .fetch('refs/heads/master')
  t.pass('yay')
})

test('shallow fetch (from Github)', async t => {
  // Setup
  let clientDir = await tmpdir()
  await pify(ncp)('fixtures/test-fetch.git', clientDir)
  // Test
  await git()
    .gitdir(clientDir)
    .depth(1)
    .remote('origin')
    .fetch('refs/heads/test-branch-shallow-clone')
  t.true(exists(`${clientDir}/shallow`))
  let shallow = await read(`${clientDir}/shallow`, { encoding: 'utf8' })
  t.true(shallow === '92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n')
  // Now test deepen
  await git()
    .gitdir(clientDir)
    .depth(2)
    .remote('origin')
    .fetch('refs/heads/test-branch-shallow-clone')
  shallow = await read(`${clientDir}/shallow`, { encoding: 'utf8' })
  t.true(shallow === '86ec153c7b48e02f92930d07542680f60d104d31\n')
})
