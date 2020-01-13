/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-readTree.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { readTree } = require('isomorphic-git')

describe('readTree', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('read a tree directly', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readTree')
    // Test
    const { oid, tree } = await readTree({
      gitdir,
      oid: '6257985e3378ec42a03a57a7dc8eb952d69a5ff3'
    })
    expect(oid).toEqual('6257985e3378ec42a03a57a7dc8eb952d69a5ff3')
    expect(tree).toMatchSnapshot()
  })
  it('peels tags', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readTree')
    // Test
    const { oid, tree } = await readTree({
      gitdir,
      oid: '86167ce7861387275b2fbd188e031e00aff446f9'
    })
    expect(oid).toEqual('6257985e3378ec42a03a57a7dc8eb952d69a5ff3')
    expect(tree).toMatchSnapshot()
  })
  it('with simple filepath to tree', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readTree')
    // Test
    const { oid, tree } = await readTree({
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      filepath: ''
    })
    expect(oid).toEqual('6257985e3378ec42a03a57a7dc8eb952d69a5ff3')
    expect(tree).toMatchSnapshot()
  })
  it('with deep filepath to tree', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readTree')
    // Test
    const { oid, tree } = await readTree({
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      filepath: 'src/commands'
    })
    expect(oid).toEqual('7704a6e8a802efcdbe6cf3dfa114c105f1d5c67a')
    expect(tree).toMatchSnapshot()
  })
  it('with erroneous filepath (directory is a file)', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readTree')
    // Test
    let error = null
    try {
      await readTree({
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
    const { gitdir } = await makeFixture('test-readTree')
    // Test
    let error = null
    try {
      await readTree({
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
    const { gitdir } = await makeFixture('test-readTree')
    // Test
    let error = null
    try {
      await readTree({
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
    const { gitdir } = await makeFixture('test-readTree')
    // Test
    let error = null
    try {
      await readTree({
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
