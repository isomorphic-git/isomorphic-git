/* globals jest describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const pify = require('pify')
const { commit, sign, verify } = require('isomorphic-git')

describe('commit', () => {
  it('commit', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-commit')
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
    let { fs, dir, gitdir } = await makeFixture('test-commit')
    // Test
    let error = null
    try {
      let sha = await commit({
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
      let sha = await commit({
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
    const openpgp = require('openpgp/dist/openpgp.min.js')

    let { fs, dir, gitdir } = await makeFixture('test-commit')
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
    await sign({
      fs,
      gitdir,
      openpgp,
      privateKeys: privateKeys[0]
    })
    const publicKeys = await require('./__fixtures__/openpgp-public-keys.json')
    let keys = await verify({
      fs,
      gitdir,
      openpgp,
      ref: 'HEAD',
      publicKeys: publicKeys[0]
    })
    expect(keys[0]).toBe('a01edd29ac0f3952')
  })
})
