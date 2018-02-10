/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
import { readObject } from 'isomorphic-git'

describe('readObject', () => {
  it('test missing', async () => {
    let { fs, gitdir } = await makeFixture('test-readObject')
    let ref = readObject({
      fs,
      gitdir,
      oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    })
    await expect(ref).rejects.toMatchSnapshot()
  })
  it('test shallow', async () => {
    let { fs, gitdir } = await makeFixture('test-readObject')
    let ref = readObject({
      fs,
      gitdir,
      oid: 'b8b1fcecbc6f5ea8bc915c3ac319e8c9eb204f95'
    })
    await expect(ref).rejects.toMatchSnapshot()
  })
  it('parsed', async () => {
    let { fs, gitdir } = await makeFixture('test-readObject')
    let ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
    })
    expect(ref).toMatchSnapshot()
    expect(ref.format).toBe('parsed')
    expect(ref.type).toBe('commit')
  })
  it('content', async () => {
    let { fs, gitdir } = await makeFixture('test-readObject')
    let ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'content'
    })
    expect(ref.format).toBe('content')
    expect(ref.type).toBe('commit')
    expect(ref.source).toBe(
      './objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e'
    )
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
  it('wrapped', async () => {
    let { fs, gitdir } = await makeFixture('test-readObject')
    let ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'wrapped'
    })
    expect(ref.format).toBe('wrapped')
    expect(ref.type).toBe(undefined)
    expect(ref.source).toBe(
      './objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e'
    )
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
  it('deflated', async () => {
    let { fs, gitdir } = await makeFixture('test-readObject')
    let ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'deflated'
    })
    expect(ref.format).toBe('deflated')
    expect(ref.type).toBe(undefined)
    expect(ref.source).toBe(
      './objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e'
    )
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
  it('from packfile', async () => {
    let { fs, gitdir } = await makeFixture('test-readObject')
    let ref = await readObject({
      fs,
      gitdir,
      oid: '0b8faa11b353db846b40eb064dfb299816542a46',
      format: 'deflated'
    })
    expect(ref.format).toBe('content')
    expect(ref.type).toBe('commit')
    expect(ref.source).toBe(
      './objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    expect(ref.object.toString('hex')).toMatchSnapshot()
  })
})
