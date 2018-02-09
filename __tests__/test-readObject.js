/* global test describe expect */
import _fs from 'fs'
import { models } from 'isomorphic-git/internal-apis'
import { readObject } from 'isomorphic-git'
const { FileSystem } = models
const fs = new FileSystem(_fs)

describe('readObject', () => {
  test('test missing', async () => {
    let ref = readObject({
      fs,
      gitdir: '__tests__/__fixtures__/test-readObject.git',
      oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    })
    await expect(ref).rejects.toMatchSnapshot()
  })
  test('test shallow', async () => {
    let ref = readObject({
      fs,
      gitdir: '__tests__/__fixtures__/test-readObject.git',
      oid: 'b8b1fcecbc6f5ea8bc915c3ac319e8c9eb204f95'
    })
    await expect(ref).rejects.toMatchSnapshot()
  })
  test('parsed', async () => {
    let ref = await readObject({
      fs,
      gitdir: '__tests__/__fixtures__/test-readObject.git',
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
    })
    expect(ref).toMatchSnapshot()
    expect(ref.format).toBe('parsed')
    expect(ref.type).toBe('commit')
  })
  test('content', async () => {
    let ref = await readObject({
      fs,
      gitdir: '__tests__/__fixtures__/test-readObject.git',
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
  test('wrapped', async () => {
    let ref = await readObject({
      fs,
      gitdir: '__tests__/__fixtures__/test-readObject.git',
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
  test('deflated', async () => {
    let ref = await readObject({
      fs,
      gitdir: '__tests__/__fixtures__/test-readObject.git',
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
  test('from packfile', async () => {
    let ref = await readObject({
      fs,
      gitdir: '__tests__/__fixtures__/test-readObject.git',
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
