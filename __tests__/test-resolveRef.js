/* eslint-env node, browser, jasmine */
const { resolveRef } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('resolveRef', () => {
  it('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9',
    })
    expect(ref).toBe('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9')
  })
  it('test-branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'origin/test-branch',
    })
    expect(ref).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e')
  })
  it('config', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'config',
    })
    expect(ref).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e')
  })
  it('test-tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'test-tag',
    })
    expect(ref).toBe('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9')
  })
  it('HEAD', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'HEAD',
    })
    expect(ref).toBe('033417ae18b174f078f2f44232cb7a374f4c60ce')
  })
  it('HEAD depth', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2,
    })
    expect(ref).toBe('refs/heads/master')
  })
  it('packed-refs', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'v0.0.1',
    })
    expect(ref).toBe('1a2149e96a9767b281a8f10fd014835322da2d14')
  })
  it('non-existant refs', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let error = {}
    try {
      await resolveRef({
        fs,
        gitdir,
        ref: 'this-is-not-a-ref',
      })
    } catch (err) {
      error = err
    }
    expect(error.message).toBeDefined()
    expect(error.caller).toEqual('git.resolveRef')
  })
})
