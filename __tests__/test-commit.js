import git from '..'
import jsonfile from 'jsonfile'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir } from './__helpers__'

jest.setTimeout(30000)

describe('commit', () => {
  test('commit', async () => {
    // Setup
    let dir = await tmpdir()
    console.log('dir =', dir)
    await pify(ncp)('__tests__/__fixtures__/test-commit.git', dir)
    // Test
    const repo = git()
    repo.gitdir(dir)
    repo.author('Mr. Test')
    repo.email('mrtest@example.com')
    repo.timestamp(1262356920)
    let sha = await repo.commit('Initial commit')
    expect(sha === '7a51c0b1181d738198ff21c4679d3aa32eb52fe0').toBe(true)
  })

  test('GPG signing', async () => {
    // Setup
    let dir = await tmpdir()
    console.log('dir =', dir)
    await pify(ncp)('__tests__/__fixtures__/test-commit.git', dir)
    // Test
    const repo = git()
    repo.gitdir(dir)
    repo.author('Mr. Test')
    repo.email('mrtest@example.com')
    repo.timestamp(1504842425)
    const privateKeys = await pify(jsonfile.readFile)(
      '__tests__/__fixtures__/openpgp-private-keys.json'
    )
    repo.signingKey(privateKeys[0])
    let sha = await repo.commit('Initial commit')
    const publicKeys = await pify(jsonfile.readFile)(
      '__tests__/__fixtures__/openpgp-public-keys.json'
    )
    let verified = await repo.verificationKey(publicKeys[0]).verify('HEAD')
    expect(verified.keys[0] === 'a01edd29ac0f3952').toBe(true)
  })
})
