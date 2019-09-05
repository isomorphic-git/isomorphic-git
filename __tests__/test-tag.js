/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { tag, resolveRef } = require('isomorphic-git')

describe('tag', () => {
  it('creates a lightweight tag to HEAD', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-tag')
    // Test
    await tag({ gitdir, ref: 'latest' })
    const ref = await resolveRef({ gitdir, ref: 'refs/tags/latest' })
    expect(ref).toEqual('cfc039a0acb68bee8bb4f3b13b6b211dbb8c1a69')
  })
  it('fails if tag already exists', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-tag')
    // Test
    let error = null
    try {
      await tag({ gitdir, ref: 'existing-tag' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe('RefExistsError')
  })
  it('fails if tag already exists (packed)', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-tag')
    // Test
    let error = null
    try {
      await tag({ gitdir, ref: 'packed-tag' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe('RefExistsError')
  })
  it('force overwrite', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-tag')
    // Test
    let error = null
    try {
      await tag({ gitdir, ref: 'existing-tag', force: true })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
  })
  it('force overwrite (packed)', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-tag')
    // Test
    let error = null
    try {
      await tag({ gitdir, ref: 'packed-tag', force: true })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
  })
})
