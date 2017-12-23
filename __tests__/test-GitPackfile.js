/* globals describe test expect */
import { FileSystem, GitPackfile, GitObject } from '../dist/for-node/models'
import _fs from 'fs'
const fs = new FileSystem(_fs)

jest.setTimeout(20000)

const loadPackfile = async () =>
  GitPackfile.from({
    idx: await fs.read(
      '__tests__/__fixtures__/test-packfile.git/objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.idx'
    ),
    pack: await fs.read(
      '__tests__/__fixtures__/test-packfile.git/objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
  })

describe('GitPackfile', () => {
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
})
