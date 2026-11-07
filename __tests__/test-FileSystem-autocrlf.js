/* eslint-env node, browser, jasmine, jest */
import { FileSystem } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('FileSystem.read with autocrlf', () => {
  it('converts CRLF when the fs client returns a plain ArrayBuffer', async () => {
    const { _fs, dir } = await makeFixture('test-FileSystem-autocrlf')
    const promises = Object.create(_fs.promises)
    promises.readFile = async (...args) => {
      const buffer = await _fs.promises.readFile(...args)
      const bytes = new Uint8Array(buffer)
      return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.length
      )
    }
    await _fs.promises.writeFile(
      `${dir}/file.txt`,
      Buffer.from('610d0a620d0a', 'hex')
    )
    const fs = new FileSystem({ promises })
    const buffer = await fs.read(`${dir}/file.txt`, { autocrlf: 'true' })
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.toString('hex')).toEqual('610a620a')
  })
})
