// @ts-nocheck to allow working on globals (DecompressionStream/Blob/Response) that do not exist in Node12 (engines as of 2024-02-11 are ">=12")
/* eslint-env node, browser, jest, jasmine */

class FakeBlob {
  constructor() {
    this.stream = () => ({
      pipeThrough: () => {},
      cancel: () => {},
    })
  }
}

class FakeDecompressionStream {}

class FakeResponse {
  constructor() {
    this.arrayBuffer = () => Buffer.from('global stream used!')
  }
}

describe('inflate DecompressionStream usage', () => {
  let decompressionStreamOriginal
  let blobOriginal
  let responseOriginal

  let inflate
  let deflate

  beforeEach(() => {
    decompressionStreamOriginal = global.DecompressionStream || undefined
    blobOriginal = global.Blob || undefined
    responseOriginal = global.Response || undefined
  })

  afterEach(() => {
    global.DecompressionStream = decompressionStreamOriginal
    global.Blob = blobOriginal
    global.Response = responseOriginal
  })

  beforeEach(() => {
    if (typeof jest !== 'undefined') {
      jest.isolateModules(() => {
        ;({ inflate, deflate } = require('isomorphic-git/internal-apis'))
      })
    } else if (typeof jasmine !== 'undefined') {
      for (const entry in require.cache) {
        delete require.cache[entry]
      }
      ;({ inflate, deflate } = require('isomorphic-git/internal-apis'))
    }
  })

  it('DecompressionStream is used when available', async () => {
    // Setup
    global.DecompressionStream = FakeDecompressionStream
    global.Blob = FakeBlob
    global.Response = FakeResponse
    // Test
    const deflated = await deflate(Buffer.from('inflated!'))
    const result = await inflate(deflated)
    expect(Buffer.from(result).toString('utf-8')).toEqual('global stream used!')
  })

  it('pako is used in other cases', async () => {
    // Setup
    global.DecompressionStream = undefined
    global.Blob = undefined
    global.Response = undefined
    // Test
    const deflated = await deflate(Buffer.from('inflated!'))
    const result = await inflate(deflated)
    expect(Buffer.from(result).toString('utf-8')).toEqual('inflated!')
  })
})
