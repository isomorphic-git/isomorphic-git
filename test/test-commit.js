import test from 'ava'
import git from '..'
import { read } from '../lib/utils/read'
import { write } from '../lib/utils/write'
import jsonfile from 'jsonfile'
import pify from 'pify'
import path from 'omnipath'
import ncp from 'ncp'
import { tmpdir } from './_helpers'

test('git.commit()', async t => {
  // Setup
  let dir = await tmpdir()
  console.log('dir =', dir)
  await pify(ncp)('fixtures/test-commit.git', dir)
  // Test
  const repo = git()
  repo.gitdir(dir)
  repo.author('Mr. Test')
  repo.email('mrtest@example.com')
  repo.timestamp(1262356920)
  let sha = await repo.commit('Initial commit')
  t.true(sha === '7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
})

test('git.signingKey() and git.verificationKey()', async t => {
  // Setup
  let dir = await tmpdir()
  console.log('dir =', dir)
  await pify(ncp)('fixtures/test-commit.git', dir)
  // Test
  const repo = git()
  repo.gitdir(dir)
  repo.author('Mr. Test')
  repo.email('mrtest@example.com')
  repo.timestamp(1504842425)
  const privateKeys = await pify(jsonfile.readFile)(
    'fixtures/openpgp-private-keys.json'
  )
  repo.signingKey(privateKeys[0])
  let sha = await repo.commit('Initial commit')
  const publicKeys = await pify(jsonfile.readFile)(
    'fixtures/openpgp-public-keys.json'
  )
  let verified = await repo.verificationKey(publicKeys[0]).verify('HEAD')
  t.true(verified.keys[0] === 'a01edd29ac0f3952')
})
