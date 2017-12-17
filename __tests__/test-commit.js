/* globals jest describe test expect */
import { copyFixtureIntoTempDir } from 'jest-fixtures'
import fs from 'fs'
import jsonfile from 'jsonfile'
import pify from 'pify'
import { Git, commit, verify } from '..'

jest.setTimeout(30000)

/** @test {commit} */
describe('commit', () => {
  test('commit', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-commit.git')
    // Test
    const repo = new Git({ fs, gitdir })
    let sha = await commit({
      ...repo,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920
      },
      message: 'Initial commit'
    })
    expect(sha === '7a51c0b1181d738198ff21c4679d3aa32eb52fe0').toBe(true)
  })

  test('GPG signing', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-commit.git')
    // Test
    const repo = new Git({ fs, gitdir })
    const privateKeys = await pify(jsonfile.readFile)(
      '__tests__/__fixtures__/openpgp-private-keys.json'
    )
    await commit({
      ...repo,
      message: 'Initial commit',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1504842425
      },
      privateKeys: privateKeys[0]
    })
    const publicKeys = await pify(jsonfile.readFile)(
      '__tests__/__fixtures__/openpgp-public-keys.json'
    )
    let verified = await verify({
      ...repo,
      ref: 'HEAD',
      publicKeys: publicKeys[0]
    })
    expect(verified.keys[0] === 'a01edd29ac0f3952').toBe(true)
  })
})
