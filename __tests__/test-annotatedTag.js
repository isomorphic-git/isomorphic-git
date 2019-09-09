/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const {
  cores,
  annotatedTag,
  verify,
  resolveRef,
  readObject
} = require('isomorphic-git')

describe('annotatedTag', () => {
  it('creates an annotated tag to HEAD', async () => {
    // Setup
    const { core, gitdir } = await makeFixture('test-annotatedTag')
    // Test
    await annotatedTag({
      core,
      gitdir,
      ref: 'latest',
      message: 'some tag message',
      tagger: {
        name: 'Yu Shimura',
        email: 'mail@yuhr.org'
      }
    })
    const tagRef = await resolveRef({ core, gitdir, ref: 'refs/tags/latest' })
    const { object: tagObject } = await readObject({
      core,
      gitdir,
      oid: tagRef
    })
    expect(tagObject.object).toEqual('cfc039a0acb68bee8bb4f3b13b6b211dbb8c1a69')
  })
  it('creates an annotated tag pointing to a blob', async () => {
    // Setup
    const { core, gitdir } = await makeFixture('test-annotatedTag')
    // Test
    await annotatedTag({
      core,
      gitdir,
      ref: 'latest-blob',
      message: 'some tag message',
      tagger: {
        name: 'Yu Shimura',
        email: 'mail@yuhr.org'
      },
      object: 'd670460b4b4aece5915caf5c68d12f560a9fe3e4'
    })
    const tagRef = await resolveRef({
      core,
      gitdir,
      ref: 'refs/tags/latest-blob'
    })
    const { object: tagObject } = await readObject({
      core,
      gitdir,
      oid: tagRef
    })
    expect(tagObject.object).toEqual('d670460b4b4aece5915caf5c68d12f560a9fe3e4')
  })
  it('creates a signed tag to HEAD', async () => {
    // Setup
    const { pgp } = require('@isomorphic-git/pgp-plugin')
    const { core, gitdir } = await makeFixture('test-annotatedTag')
    cores.get(core).set('pgp', pgp)
    // Test
    const { privateKey, publicKey } = require('./__fixtures__/pgp-keys.js')
    await annotatedTag({
      core,
      gitdir,
      ref: 'latest',
      message: 'some tag message',
      tagger: {
        name: 'Yu Shimura',
        email: 'mail@yuhr.org'
      },
      signingKey: privateKey
    })
    const keys = await verify({
      core,
      gitdir,
      ref: 'latest',
      publicKeys: publicKey
    })
    expect(keys[0]).toBe('f2f0ced8a52613c4')
  })
})
