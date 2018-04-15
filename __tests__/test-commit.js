/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { GitOpenPGP } = require('@isomorphic-git/openpgp-plugin')
const { commit, sign, verify, use } = require('isomorphic-git')

use(GitOpenPGP)

describe('commit', () => {
  it('commit', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-commit')
    // Test
    let sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920
      },
      message: 'Initial commit'
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
  })

  it('throw error if missing author', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-commit')
    // Test
    let error = null
    try {
      await commit({
        fs,
        gitdir,
        author: {
          email: 'mrtest@example.com',
          timestamp: 1262356920
        },
        message: 'Initial commit'
      })
    } catch (err) {
      error = err.message
    }
    expect(error).toBe(
      'Author name and email must be specified as an argument or in the .git/config file'
    )
    // reset for test 2
    error = null
    try {
      await commit({
        fs,
        gitdir,
        author: {
          name: 'Mr. Test',
          timestamp: 1262356920
        },
        message: 'Initial commit'
      })
    } catch (err) {
      error = err.message
    }
    expect(error).toBe(
      'Author name and email must be specified as an argument or in the .git/config file'
    )
  })

  it('GPG signing', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-commit')
    // Test
    const privateKeys = require('./__fixtures__/openpgp-private-keys.json')
    await commit({
      fs,
      gitdir,
      message: 'Initial commit',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1504842425
      }
    })
    let commitDescription = await sign({
      fs,
      gitdir,
      privateKeys: privateKeys[0]
    })
    expect(commitDescription.payload).toEqual(`tree a69b2f53db7b7ba59f43ee15f5c42166297c4262
parent 1386e77b0a7afa8333663a9e4cbf8e6158e625c1
author Mr. Test <mrtest@example.com> 1504842425 -0000
committer Mr. Test <mrtest@example.com> 1504842425 -0000

Initial commit
`)
    const publicKeys = await require('./__fixtures__/openpgp-public-keys.json')
    let keys = await verify({
      fs,
      gitdir,
      ref: 'HEAD',
      publicKeys: publicKeys[0]
    })
    expect(keys.valid).toBeDefined()
    expect(keys.invalid).toBeUndefined()
    expect(keys.valid[0]).toBe('a01edd29ac0f3952')
  })
})
