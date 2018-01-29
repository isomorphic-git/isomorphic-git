/* global test describe expect */
import fs from 'fs'
import path from 'path'
import { createTempDir } from 'jest-fixtures'
import { unpack, managers } from '../dist/for-node/internal-apis'
import { init } from '..'
const { GitObjectManager } = managers

describe('unpack', () => {
  test('unpack', async () => {
    let dir = await createTempDir()
    let repo = { fs, dir }
    await init(repo)
    let fixture = fs.createReadStream(
      '__tests__/__fixtures__/test-pack/foobar-76178ca22ef818f971fca371d84bce571d474b1d.pack'
    )
    await unpack({ ...repo, inputStream: fixture })
    const oids = [
      '5a9da3272badb2d3c8dbab463aed5741acb15a33',
      '0bfe8fa3764089465235461624f2ede1533e74ec',
      '414a0afa7e20452d90ab52de1c024182531c5c52',
      '97b32c43e96acc7873a1990e409194cb92421522',
      '328e74b65839f7e5a8ae3b54e0b49180a5b7b82b',
      'fdba2ad440c231d15a2179f729b4b50ab5860df2',
      '5171f8a8291d7edc31a6670800d5967cfd6be830',
      '7983b4770a894a068152dfe6f347ea9b5ae561c5',
      'f03ae7b490022507f83729b9227e723ab1587a38',
      'a59efbcd7640e659ec81887a2599711f8d9ef801',
      'e5abf40a5b37382c700f51ac5c2aeefdadb8e184',
      '5477471ab5a6a8f2c217023532475044117a8f2c'
    ]
    for (let oid of oids) {
      let filepath = path.join(
        dir,
        '.git',
        'objects',
        oid.slice(0, 2),
        oid.slice(2)
      )
      let e = fs.existsSync(filepath)
      expect(e).toBe(true)
      let { type, object } = await GitObjectManager.read({
        fs,
        gitdir: path.join(dir, '.git'),
        oid
      })
      expect(typeof type === 'string').toBe(true)
      expect(Buffer.isBuffer(object)).toBe(true)
    }
  })
})
