/* globals describe test expect */
import { FileSystem, GitPackfile, GitObject } from '../dist/for-node/models'
import _fs from 'fs'
const fs = new FileSystem(_fs)

jest.setTimeout(60000)

const loadPackfile = async () =>
  GitPackfile.fromIDX({
    idx: await fs.read(
      '__tests__/__fixtures__/test-packfile.git/objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
    ),
    pack: await fs.read(
      '__tests__/__fixtures__/test-packfile.git/objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
  })

describe('GitPackfile', () => {
  test('size', async () => {
    let p = await loadPackfile()
    expect(p.size).toBe(769)
    expect(p.hashes).toMatchSnapshot()
    expect(p.packfileSha).toBe('1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888')
  })
  test('offsets', async () => {
    let p = await loadPackfile()
    // Test a handful of known offsets + lengths.
    expect(p.slices.get('0b8faa11b353db846b40eb064dfb299816542a46')).toEqual([
      40077,
      40077 + 192
    ])
    expect(p.slices.get('637c4e69d85e0dcc18898ec251377453d0891585')).toEqual([
      39860,
      39860 + 217
    ])
    expect(p.slices.get('98e9fde3ee878fa985a143fc5fe05d4e6d8e637b')).toEqual([
      39036,
      39036 + 824
    ])
    expect(p.slices.get('43c49edb213748626fc363c890c01a9e55a1b8da')).toEqual([
      38202,
      38202 + 834
    ])
    expect(p.slices.get('5f1f014326b1d7e8079d00b87fa7a9913bd91324')).toEqual([
      20855,
      20855 + 31
    ])
  })
  test('read undeltified object', async () => {
    let p = await loadPackfile()
    let { type, object } = await p.read({
      oid: '637c4e69d85e0dcc18898ec251377453d0891585'
    })
    expect(type).toBe('commit')
    expect(object.toString('utf8')).toMatchSnapshot()
    let { oid } = GitObject.wrap({ type, object })
    expect(oid).toBe('637c4e69d85e0dcc18898ec251377453d0891585')
  })
  test('read deltified object', async () => {
    '5f1f014326b1d7e8079d00b87fa7a9913bd91324' // 'c2ed6204dc5e2293031b11f77f5f3d934a1f3a05'
    let p = await loadPackfile()
    let { type, object } = await p.read({
      oid: '7fb539a8e8488c3fd2793e7dda8a44693e25cce1' // 9 levels deep of deltification.
    })
    expect(type).toBe('blob')
    expect(object.toString('utf8')).toMatchSnapshot()
    let { oid } = GitObject.wrap({ type, object })
    expect(oid).toBe('7fb539a8e8488c3fd2793e7dda8a44693e25cce1')
  })
  test('write IDX', async () => {
    let originalIDX = await fs.read(
      '__tests__/__fixtures__/test-packfile.git/objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
    )
    let packfile = await GitPackfile.fromIDX({
      idx: originalIDX,
      pack: await fs.read(
        '__tests__/__fixtures__/test-packfile.git/objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
      )
    })
    let idx = await packfile.writeIDX()
    await fs.write('IDXFILE.idx', idx)
    expect(idx.byteLength).toBe(originalIDX.byteLength)
    expect(idx.equals(originalIDX)).toBe(true)
  })
  test('create IDX', async () => {
    let originalIDX = await fs.read(
      '__tests__/__fixtures__/test-packfile.git/objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
    )
    let idx = await GitPackfile.createIDX({
      pack: await fs.read(
        '__tests__/__fixtures__/test-packfile.git/objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
      )
    })
    await fs.write('IDXFILE2.idx', idx)
    expect(idx.byteLength).toBe(originalIDX.byteLength)
    expect(idx.equals(originalIDX)).toBe(true)
  })
})
