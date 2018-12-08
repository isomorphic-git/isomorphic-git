/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-annotatedTag.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, annotatedTag, verify, resolveRef, readObject } = require('isomorphic-git')

describe('annotatedTag', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('creates an annotated tag to HEAD', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-tag')
    plugins.set('fs', fs)
    // Test
    await annotatedTag({
      gitdir,
      name: 'latest',
      object: {
        message: 'some tag message',
        tagger: {
          name: 'Yu Shimura',
          email: 'mail@yuhr.org'
        }
      }
    })
    const tagRef = await resolveRef({ gitdir, ref: 'refs/tags/latest' })
    const tagObject = (await readObject({ gitdir, oid: tagRef })).object
    expect(tagObject.object).toMatchSnapshot()
  })
  it('creates a signed tag to HEAD', async () => {
    // Setup
    const { pgp } = require('@isomorphic-git/pgp-plugin')
    let { fs, gitdir } = await makeFixture('test-tag')
    plugins.set('fs', fs)
    plugins.set('pgp', pgp)
    // Test
    const { privateKey, publicKey } = require('./__fixtures__/pgp-keys.js')
    await annotatedTag({
      gitdir,
      name: 'latest',
      object: {
        message: 'some tag message',
        tagger: {
          name: 'Yu Shimura',
          email: 'mail@yuhr.org'
        }
      },
      signingKey: privateKey
    })
    let keys = await verify({
      gitdir,
      ref: 'latest',
      publicKeys: publicKey
    })
    expect(keys[0]).toBe('f2f0ced8a52613c4')
  })
})
