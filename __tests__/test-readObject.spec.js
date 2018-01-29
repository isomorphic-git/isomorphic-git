/* global test describe expect */
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { readObject } = require('..')

describe('readObject', () => {
  beforeAll(() => {
    registerSnapshots(require('./test-readObject.snap'), 'readObject')
  })
  it('test missing', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    try {
      var ref = await readObject({
        fs,
        gitdir,
        oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      })
    } catch (err) {
      var ref = err.message
    }
    expectjs(ref).toMatchSnapshot()
  })
  it('test shallow', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    try {
      var ref = await readObject({
        fs,
        gitdir,
        oid: 'b8b1fcecbc6f5ea8bc915c3ac319e8c9eb204f95'
      })
    } catch (err) {
      var ref = err.message
    }
    expectjs(ref).toMatchSnapshot()
  })
  it('parsed', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
    })
    expectjs(ref).toMatchSnapshot()
    expect(ref.format).toEqual('parsed')
    expect(ref.type).toEqual('commit')
  })
  it('content', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'content'
    })
    expectjs(ref).toMatchSnapshot()
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('commit')
  })
  it('wrapped', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'wrapped'
    })
    expectjs(ref).toMatchSnapshot()
    expect(ref.format).toEqual('wrapped')
    expect(ref.type).toEqual(undefined)
  })
  it('deflated', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'deflated'
    })
    expectjs(ref).toMatchSnapshot()
    expect(ref.format).toEqual('deflated')
    expect(ref.type).toEqual(undefined)
  })
  it('from packfile', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let ref = await readObject({
      fs,
      gitdir,
      oid: '0b8faa11b353db846b40eb064dfb299816542a46',
      format: 'deflated'
    })
    expectjs(ref).toMatchSnapshot()
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('commit')
  })
})
