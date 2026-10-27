/* eslint-env node, browser, jasmine */
import * as path from 'path'

import { GitPackIndex, GitObject, shasum } from 'isomorphic-git/internal-apis'
import pako from 'pako'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

// Run `fn` and count the calls to `readSlice`. Return the result and the count.
async function countReadSlice(fn) {
  const original = GitPackIndex.prototype.readSlice
  let count = 0
  GitPackIndex.prototype.readSlice = function (...args) {
    count++
    return original.apply(this, args)
  }
  try {
    const result = await fn()
    return [result, count]
  } finally {
    GitPackIndex.prototype.readSlice = original
  }
}

// Make one pack entry: the header, the extra bytes of a delta, and the deflated data.
function packEntry(type, data, extra = Buffer.alloc(0)) {
  const header = []
  let size = data.byteLength
  let byte = (type << 4) | (size & 0b1111)
  size >>= 4
  while (size > 0) {
    header.push(byte | 0b10000000)
    byte = size & 0b1111111
    size >>= 7
  }
  header.push(byte)
  return Buffer.concat([
    Buffer.from(header),
    extra,
    Buffer.from(pako.deflate(data)),
  ])
}

describe('GitPackIndex', () => {
  it('from .idx', async () => {
    const { fs, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-GitPackIndex')
    const idx = await fs.read(
      path.join(
        gitdirsmfullpath,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
      )
    )
    const p = await GitPackIndex.fromIdx({ idx })
    expect(
      await shasum(Buffer.from(JSON.stringify(p.hashes)))
    ).toMatchInlineSnapshot('"fd2404a29d1e5dc72066541366d5f75bc9d51c9b"')
    expect(p.packfileSha).toBe('1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888')
    // Test a handful of known offsets.
    expect(p.offsets.get('0b8faa11b353db846b40eb064dfb299816542a46')).toEqual(
      40077
    )
    expect(p.offsets.get('637c4e69d85e0dcc18898ec251377453d0891585')).toEqual(
      39860
    )
    expect(p.offsets.get('98e9fde3ee878fa985a143fc5fe05d4e6d8e637b')).toEqual(
      39036
    )
    expect(p.offsets.get('43c49edb213748626fc363c890c01a9e55a1b8da')).toEqual(
      38202
    )
    expect(p.offsets.get('5f1f014326b1d7e8079d00b87fa7a9913bd91324')).toEqual(
      20855
    )
  })
  it('from .pack', async () => {
    const { fs, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-GitPackIndex')
    const pack = await fs.read(
      path.join(
        gitdirsmfullpath,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
      )
    )
    const p = await GitPackIndex.fromPack({ pack })
    expect(
      await shasum(Buffer.from(JSON.stringify(p.hashes)))
    ).toMatchInlineSnapshot('"fd2404a29d1e5dc72066541366d5f75bc9d51c9b"')
    expect(p.packfileSha).toBe('1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888')
    // Test a handful of known offsets.
    expect(p.offsets.get('0b8faa11b353db846b40eb064dfb299816542a46')).toEqual(
      40077
    )
    expect(p.offsets.get('637c4e69d85e0dcc18898ec251377453d0891585')).toEqual(
      39860
    )
    expect(p.offsets.get('98e9fde3ee878fa985a143fc5fe05d4e6d8e637b')).toEqual(
      39036
    )
    expect(p.offsets.get('43c49edb213748626fc363c890c01a9e55a1b8da')).toEqual(
      38202
    )
    expect(p.offsets.get('5f1f014326b1d7e8079d00b87fa7a9913bd91324')).toEqual(
      20855
    )
  })
  it('from .pack when pack is truncated', async () => {
    const { fs, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-GitPackIndex')
    const pack = await fs.read(
      path.join(
        gitdirsmfullpath,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
      )
    )
    const p = await GitPackIndex.fromPack({ pack: pack.slice(0, 12) })
    expect(p.offsets.size).toBe(0)
  })
  it('to .idx file from .pack', async () => {
    const { fs, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-GitPackIndex')
    const idx = await fs.read(
      path.join(
        gitdirsmfullpath,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
      )
    )
    const pack = await fs.read(
      path.join(
        gitdirsmfullpath,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
      )
    )
    const p = await GitPackIndex.fromPack({ pack })
    const idxbuffer = await p.toBuffer()
    expect(idxbuffer.byteLength).toBe(idx.byteLength)
    expect(idxbuffer.equals(idx)).toBe(true)
  })
  it('read undeltified object', async () => {
    const { fs, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-GitPackIndex')
    const idx = await fs.read(
      path.join(
        gitdirsmfullpath,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
      )
    )
    const pack = await fs.read(
      path.join(
        gitdirsmfullpath,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
      )
    )
    const p = await GitPackIndex.fromIdx({ idx })
    await p.load({ pack })
    const { type, object } = await p.read({
      oid: '637c4e69d85e0dcc18898ec251377453d0891585',
    })
    expect(type).toBe('commit')
    const oid = await shasum(GitObject.wrap({ type, object }))
    expect(oid).toBe('637c4e69d85e0dcc18898ec251377453d0891585')
    expect(object.toString('utf8')).toMatchInlineSnapshot(`
      "tree cbd2a3d7e00a972faaf0ef59d9b421de9f1a7532
      parent fbd56b49d400a19ee185ae735417bdb34c084621
      parent 0b8faa11b353db846b40eb064dfb299816542a46
      author William Hilton <wmhilton@gmail.com> 1508204014 -0400
      committer William Hilton <wmhilton@gmail.com> 1508204014 -0400
      
      WIP on master: fbd56b4 Add 'unpkg' key to package.json
      "
    `)
  })
  it('read deltified object', async () => {
    const { fs, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-GitPackIndex')
    const idx = await fs.read(
      path.join(
        gitdirsmfullpath,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
      )
    )
    const pack = await fs.read(
      path.join(
        gitdirsmfullpath,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
      )
    )
    const p = await GitPackIndex.fromIdx({ idx })
    await p.load({ pack })
    const { type, object } = await p.read({
      oid: '7fb539a8e8488c3fd2793e7dda8a44693e25cce1', // 9 levels deep of deltification.
    })
    expect(type).toBe('blob')
    const oid = await shasum(GitObject.wrap({ type, object }))
    expect(oid).toBe('7fb539a8e8488c3fd2793e7dda8a44693e25cce1')
  })
  it('from .pack reads no object again when the first pass resolves all', async () => {
    const { fs, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-GitPackIndex')
    const name = 'pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888'
    const idx = await fs.read(
      path.join(gitdirsmfullpath, `objects/pack/${name}.idx`)
    )
    const pack = await fs.read(
      path.join(gitdirsmfullpath, `objects/pack/${name}.pack`)
    )
    // This pack has objects up to 9 levels deep. The base of each ofs-delta
    // comes first, so the first pass resolves every object. If the count is
    // not zero, the fast path failed and `fromPack` used the slow path.
    const [p, calls] = await countReadSlice(() =>
      GitPackIndex.fromPack({ pack })
    )
    expect(calls).toBe(0)
    expect((await p.toBuffer()).equals(idx)).toBe(true)
  })
  it('from .pack with an ofs-delta chain deeper than the read cache', async () => {
    const { fs, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-GitPackIndex-deltas'
    )
    const name = 'pack-db4ddebd9df5648bbfaef2b846684bc3a04cb834'
    const idx = await fs.read(
      path.join(gitdirsmfullpath, `objects/pack/${name}.idx`)
    )
    const pack = await fs.read(
      path.join(gitdirsmfullpath, `objects/pack/${name}.pack`)
    )
    // The blob below is at the end of a chain of 6 ofs-deltas.
    const oid = 'dbf0e225e7c4a19ec7b23afcfbe0077edc78a79e'
    const [p, calls] = await countReadSlice(() =>
      GitPackIndex.fromPack({ pack })
    )
    expect(calls).toBe(0)
    expect((await p.toBuffer()).equals(idx)).toBe(true)
    // `readSlice` keeps only objects deeper than 3 levels. Read the chain with it.
    const q = await GitPackIndex.fromIdx({ idx })
    await q.load({ pack })
    q.readDepth = 0
    const [read, readCalls] = await countReadSlice(() => q.read({ oid }))
    expect(readCalls).toBe(7)
    expect(await shasum(GitObject.wrap(read))).toBe(oid)
  })
  it('from .pack skips a ref-delta whose base comes later', async () => {
    const { fs, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-GitPackIndex-deltas'
    )
    const pack = await fs.read(
      path.join(gitdirsmfullpath, 'ref-delta-base-later.pack')
    )
    // This pack has a blob and a chain of 3 ref-deltas that come before it.
    // Native git indexes all 4 objects. This code indexes only the blob,
    // because a delta can name only a base that it has already indexed.
    // This test makes sure that the single pass does not change that.
    const p = await GitPackIndex.fromPack({ pack })
    expect(p.hashes).toEqual(['52dfa468f6381299c91be07e9dc9a1447ca87ae7'])
    expect(p.offsets.get('52dfa468f6381299c91be07e9dc9a1447ca87ae7')).toBe(169)
  })
  it('from .pack reads a delta again when its base is too large to keep', async () => {
    const { fs, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-GitPackIndex-deltas'
    )
    const name = 'pack-2bcbe92e0b11a06101c5fdac42621587c2b41581'
    const idx = await fs.read(
      path.join(gitdirsmfullpath, `objects/pack/${name}.idx`)
    )
    const pack = await fs.read(
      path.join(gitdirsmfullpath, `objects/pack/${name}.pack`)
    )
    // The base blob has 9 MiB. The cache does not keep an object that large.
    // The ref-delta is the only object that needs `readSlice`.
    const [p, calls] = await countReadSlice(() =>
      GitPackIndex.fromPack({ pack })
    )
    expect(calls).toBeGreaterThan(0)
    expect((await p.toBuffer()).equals(idx)).toBe(true)
  })
  it('from .pack with a thin pack whose base is external', async () => {
    const { fs, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-GitPackIndex-deltas'
    )
    const name = 'pack-db4ddebd9df5648bbfaef2b846684bc3a04cb834'
    const thin = await fs.read(path.join(gitdirsmfullpath, 'thin.pack'))
    const basePack = await fs.read(
      path.join(gitdirsmfullpath, `objects/pack/${name}.pack`)
    )
    const baseIdx = await fs.read(
      path.join(gitdirsmfullpath, `objects/pack/${name}.idx`)
    )
    const base = await GitPackIndex.fromIdx({ idx: baseIdx })
    await base.load({ pack: basePack })
    const external = []
    const getExternalRefDelta = oid => {
      external.push(oid)
      return base.read({ oid })
    }
    const p = await GitPackIndex.fromPack({ pack: thin, getExternalRefDelta })
    // The pack has a commit, a tree, and a blob. The blob is a ref-delta.
    // Offsets and CRCs come from `git index-pack --fix-thin`.
    const expected = {
      '5b8ee527c3228886cd73c4f90fb8a4cc52f5b2e2': [12, 0x3fd98367],
      '8e1884292ce918151ae70f55383c2900253a6542': [824, 0x4af8ebd3],
      b62a4dbc3a7d6d315bec020db80a33daae5b45ad: [871, 0x9e991bd6],
    }
    expect(p.hashes).toEqual(Object.keys(expected).sort())
    for (const [oid, [offset, crc]] of Object.entries(expected)) {
      expect(p.offsets.get(oid)).toBe(offset)
      expect(p.crcs[oid]).toBe(crc)
      expect(await shasum(GitObject.wrap(await p.read({ oid })))).toBe(oid)
    }
    // The base is the blob at the end of the chain of 6 ofs-deltas.
    expect(external).toContain('dbf0e225e7c4a19ec7b23afcfbe0077edc78a79e')
  })
  it('from .pack skips a delta that does not apply', async () => {
    const blob = Buffer.from('hello\n')
    const first = packEntry(3, blob)
    // The delta says that its source has 5 bytes, but the base has 6.
    const bad = Buffer.from([5, 5, 5, 0x41, 0x42, 0x43, 0x44, 0x45])
    const offsetBack = Buffer.from([first.byteLength])
    const second = packEntry(6, bad, offsetBack)
    const header = Buffer.alloc(12)
    header.write('PACK')
    header.writeUInt32BE(2, 4)
    header.writeUInt32BE(2, 8)
    const pack = Buffer.concat([header, first, second, Buffer.alloc(20)])
    const p = await GitPackIndex.fromPack({ pack })
    const oid = await shasum(GitObject.wrap({ type: 'blob', object: blob }))
    expect(p.hashes).toEqual([oid])
    expect(p.offsets.size).toBe(1)
  })
})
