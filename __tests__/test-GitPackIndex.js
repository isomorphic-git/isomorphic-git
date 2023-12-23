/* eslint-env node, browser, jasmine */
const path = require('path')

const {
  GitPackIndex,
  GitObject,
  shasum,
} = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('GitPackIndex', () => {
  it('from .idx', async () => {
    const { fs, gitdir } = await makeFixture('test-GitPackIndex')
    const idx = await fs.read(
      path.join(
        gitdir,
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
    const { fs, gitdir } = await makeFixture('test-GitPackIndex')
    const pack = await fs.read(
      path.join(
        gitdir,
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
    const { fs, gitdir } = await makeFixture('test-GitPackIndex')
    const pack = await fs.read(
      path.join(
        gitdir,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
      )
    )
    const p = await GitPackIndex.fromPack({ pack: pack.slice(0, 12) })
    expect(p.offsets.size).toBe(0)
  })
  it('to .idx file from .pack', async () => {
    const { fs, gitdir } = await makeFixture('test-GitPackIndex')
    const idx = await fs.read(
      path.join(
        gitdir,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
      )
    )
    const pack = await fs.read(
      path.join(
        gitdir,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
      )
    )
    const p = await GitPackIndex.fromPack({ pack })
    const idxbuffer = await p.toBuffer()
    expect(idxbuffer.byteLength).toBe(idx.byteLength)
    expect(idxbuffer.equals(idx)).toBe(true)
  })
  it('read undeltified object', async () => {
    const { fs, gitdir } = await makeFixture('test-GitPackIndex')
    const idx = await fs.read(
      path.join(
        gitdir,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
      )
    )
    const pack = await fs.read(
      path.join(
        gitdir,
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
    const { fs, gitdir } = await makeFixture('test-GitPackIndex')
    const idx = await fs.read(
      path.join(
        gitdir,
        'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
      )
    )
    const pack = await fs.read(
      path.join(
        gitdir,
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
})
