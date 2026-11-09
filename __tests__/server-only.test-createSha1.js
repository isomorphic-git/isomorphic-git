/* eslint-env node, browser, jasmine */
import { createSha1 } from '../src/utils/createSha1.js'
import { createSha1 as createNodeSha1 } from '../src/utils/createSha1.node.js'

const implementations = [
  { name: 'sha.js', create: createSha1 },
  { name: 'node:crypto', create: createNodeSha1 },
]

describe('createSha1', () => {
  for (const { name, create } of implementations) {
    it(`hashes chunks with ${name}`, () => {
      const hash = create()
      hash.update(Buffer.from('a'))
      hash.update(Buffer.from('bc'))
      expect(hash.digest('hex')).toBe(
        'a9993e364706816aba3e25717850c26c9cd0d89d'
      )
    })

    it(`returns a Buffer digest of binary data with ${name}`, () => {
      const hash = create()
      hash.update(Buffer.from('5041434b00000002', 'hex'))
      hash.update(Buffer.from([0x00, 0xff, 0x80, 0x7f]))
      const digest = hash.digest()
      expect(Buffer.isBuffer(digest)).toBe(true)
      expect(digest.toString('hex')).toBe(
        '76d3bc5735fdd2bb3e0638fb688e04a67e050a6e'
      )
    })
  }
})
