/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-tag.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, tag, verify, resolveRef, readObject, writeObject } = require('isomorphic-git')

describe('tag', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('creates a lightweight tag to HEAD', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-tag')
    plugins.set('fs', fs)
    // Test
    await tag({
      gitdir,
      name: 'latest'
    })
    const ref = await resolveRef({ gitdir, ref: 'refs/tags/latest' })
    expect(ref).toMatchSnapshot()
  })
  it('creates an annotated tag to HEAD', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-tag')
    plugins.set('fs', fs)
    // Test
    await tag({
      gitdir,
      name: 'latest',
      annotated: {
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
  it('doesn\'t fail on overwrite with the same value', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-tag')
    plugins.set('fs', fs)
    // Test
    await tag({ gitdir, name: 'latest' })
    let errorName
    try {
      await tag({ gitdir, name: 'latest' })
    } catch (err) {
      errorName = err.name
    }
    expect(errorName).toBe(undefined)
  })
  it('fails on overwrite with a different value', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-tag')
    plugins.set('fs', fs)
    // Test
    await tag({ gitdir, name: 'latest' })
    const anotherOid = await writeObject({
      gitdir,
      type: 'blob',
      object: Buffer.from('hello', 'utf8')
    })
    let errorName
    try {
      await tag({ gitdir, name: 'latest', value: anotherOid })
    } catch (err) {
      errorName = err.name
    }
    expect(errorName).toBe('RefExistsError')
  })
  it('force overwrite', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-tag')
    plugins.set('fs', fs)
    // Test
    await tag({ gitdir, name: 'latest' })
    const anotherOid = await writeObject({
      gitdir,
      type: 'blob',
      object: Buffer.from('hello', 'utf8')
    })
    let errorName
    try {
      await tag({ gitdir, name: 'latest', value: anotherOid, force: true })
    } catch (err) {
      errorName = err.name
    }
    expect(errorName).not.toBe('RefExistsError')
  })
  it('creates a signed tag to HEAD', async () => {
    // Setup
    const { pgp } = require('@isomorphic-git/pgp-plugin')
    let { fs, gitdir } = await makeFixture('test-tag')
    plugins.set('fs', fs)
    plugins.set('pgp', pgp)
    // Test
    const { privateKey, publicKey } = require('./__fixtures__/pgp-keys.js')
    await tag({
      gitdir,
      name: 'latest',
      annotated: {
        message: 'some tag message',
        tagger: {
          name: 'Yu Shimura',
          email: 'mail@yuhr.org'
        },
        signingKey: privateKey
      }
    })
    let keys = await verify({
      gitdir,
      ref: 'latest',
      publicKeys: publicKey
    })
    expect(keys[0]).toBe('f2f0ced8a52613c4')
  })
})
