/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-tag.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, tag, resolveRef, writeObject } = require('isomorphic-git')

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
})
