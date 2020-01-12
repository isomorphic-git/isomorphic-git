/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-readBlob.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { readBlob, E } = require('isomorphic-git')

describe('readBlob', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('test missing', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
        gitdir,
        oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
  it('blob', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    const { blob } = await readBlob({
      gitdir,
      oid: '4551a1856279dde6ae9d65862a1dff59a5f199d8'
    })
    expect(blob.toString('utf8')).toMatchSnapshot()
  })
  it('peels tags', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    const { oid } = await readBlob({
      gitdir,
      oid: 'cdf8e34555b62edbbe978f20d7b4796cff781f9d'
    })
    expect(oid).toBe('4551a1856279dde6ae9d65862a1dff59a5f199d8')
  })
  it('with simple filepath to blob', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    const { oid, blob } = await readBlob({
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      filepath: 'cli.js'
    })
    expect(oid).toEqual('4551a1856279dde6ae9d65862a1dff59a5f199d8')
    expect(blob.toString('hex')).toMatchSnapshot()
  })
  it('with deep filepath to blob', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    const { oid, blob } = await readBlob({
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      filepath: 'src/commands/clone.js'
    })
    expect(oid).toEqual('5264f23285d8be3ce45f95c102001ffa1d5391d3')
    expect(blob.toString('hex')).toMatchSnapshot()
  })
  it('with simple filepath to tree', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        filepath: ''
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(E.ObjectTypeAssertionFail)
  })
  it('with erroneous filepath (directory is a file)', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        filepath: 'src/commands/clone.js/isntafolder.txt'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
  it('with erroneous filepath (no such directory)', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        filepath: 'src/isntafolder'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
  it('with erroneous filepath (leading slash)', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        filepath: '/src'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
  it('with erroneous filepath (trailing slash)', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        filepath: 'src/'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
})
