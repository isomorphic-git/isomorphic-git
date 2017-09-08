import test from 'ava'
import git from '../lib'
import read from '../lib/utils/read'
import write from '../lib/utils/write'
import jsonfile from 'jsonfile'
import pify from 'pify'
process.env.TZ = 'utc'

test('git.commit()', async t => {
  const repo = git()
  repo.gitdir('fixtures/test-commit.git')
  await repo.init()
  await write('fixtures/test-commit.git/index', await read('fixtures/test-commit/index-1'))
  await write('fixtures/test-commit.git/refs/heads/master', '1386e77b0a7afa8333663a9e4cbf8e6158e625c1\n')
  await write('fixtures/test-commit.git/HEAD', 'ref: refs/heads/master\n')
  repo.author('Mr. Test')
  repo.email('mrtest@example.com')
  repo.timestamp(1262356920)
  let sha = await repo.commit('Initial commit')
  t.true(sha === '7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
})

test('git.signingKey() and git.verificationKey()', async t => {
  const repo = git()
  repo.gitdir('fixtures/test-commit.git')
  await repo.init()
  await write('fixtures/test-commit.git/index', await read('fixtures/test-commit/index-1'))
  await write('fixtures/test-commit.git/refs/heads/master', '1386e77b0a7afa8333663a9e4cbf8e6158e625c1\n')
  await write('fixtures/test-commit.git/HEAD', 'ref: refs/heads/master\n')
  repo.author('Mr. Test')
  repo.email('mrtest@example.com')
  repo.timestamp(1504842425)
  const privateKeys = await pify(jsonfile.readFile)('fixtures/openpgp-private-keys.json')
  console.log('privateKeys =', privateKeys)
  repo.signingKey(privateKeys[0])
  let sha = await repo.commit('Initial commit')
  console.log('sha =', sha)
  const publicKeys = await pify(jsonfile.readFile)('fixtures/openpgp-public-keys.json')
  let verified = await repo.verificationKey(publicKeys[0]).verify('HEAD')
  console.log('verified =', verified)
  t.true(verified)
})
