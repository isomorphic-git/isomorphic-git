/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-readObject.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { readObject } = require('isomorphic-git')

describe('readObject', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('test missing', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
        gitdir,
        oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
  it('parsed', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
    })
    expect(ref).toMatchSnapshot()
    expect(ref.format).toEqual('parsed')
    expect(ref.type).toEqual('commit')
  })
  it('content', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'content'
    })
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('commit')
    expect(ref.source).toBe('objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e')
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
  it('wrapped', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'wrapped'
    })
    expect(ref.format).toEqual('wrapped')
    expect(ref.type).toEqual(undefined)
    expect(ref.source).toBe('objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e')
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
  it('deflated', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'deflated'
    })
    expect(ref.format).toEqual('deflated')
    expect(ref.type).toEqual(undefined)
    expect(ref.source).toBe('objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e')
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
  it('from packfile', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: '0b8faa11b353db846b40eb064dfb299816542a46',
      format: 'deflated'
    })
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('commit')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
  it('blob with encoding', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: '4551a1856279dde6ae9d65862a1dff59a5f199d8',
      format: 'parsed',
      encoding: 'utf8'
    })
    expect(ref.format).toEqual('parsed')
    expect(ref.type).toEqual('blob')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    expect(ref.object).toMatchSnapshot()
  })
  it('with simple filepath to blob', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      format: 'parsed',
      filepath: 'cli.js'
    })
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('blob')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    expect(ref.oid).toEqual('4551a1856279dde6ae9d65862a1dff59a5f199d8')
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
  it('with deep filepath to blob', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      format: 'parsed',
      filepath: 'src/commands/clone.js'
    })
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('blob')
    expect(ref.oid).toEqual('5264f23285d8be3ce45f95c102001ffa1d5391d3')
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
  it('with simple filepath to tree', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      format: 'parsed',
      filepath: ''
    })
    expect(ref.format).toEqual('parsed')
    expect(ref.type).toEqual('tree')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    expect(ref.oid).toEqual('6257985e3378ec42a03a57a7dc8eb952d69a5ff3')
    expect(ref.object).toMatchSnapshot()
  })
  it('with deep filepath to tree', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      format: 'parsed',
      filepath: 'src/commands'
    })
    expect(ref.format).toEqual('parsed')
    expect(ref.type).toEqual('tree')
    expect(ref.oid).toEqual('7704a6e8a802efcdbe6cf3dfa114c105f1d5c67a')
    expect(ref.object).toMatchSnapshot()
  })
  it('with erroneous filepath (directory is a file)', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        format: 'parsed',
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
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        format: 'parsed',
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
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        format: 'parsed',
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
    let { gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        format: 'parsed',
        filepath: 'src/'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
})
