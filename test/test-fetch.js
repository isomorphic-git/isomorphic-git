import test from 'ava'
import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir } from './_helpers'

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
