/* eslint-env node, jasmine */
import { jest } from '@jest/globals'
import pako from 'pako'

describe('_writeObject deflate', () => {
  it('deflates an object only when it writes the object', async () => {
    const deflate = jest.fn(async buffer => pako.deflate(buffer))
    jest.unstable_mockModule('../src/utils/deflate.js', () => ({ deflate }))
    // Import after the mock, so that writeObject.js gets the spy.
    const { _writeObject } = await import('isomorphic-git/internal-apis')
    const { makeFixture } = await import('./__helpers__/FixtureFS.js')
    const { fs, gitdir } = await makeFixture('test-commit-packed')
    const cache = {}
    const write = content =>
      _writeObject({
        fs,
        cache,
        gitdir,
        type: 'blob',
        object: Buffer.from(content),
      })

    // 'b\n' is in the fixture's pack; 'new\n' is not.
    await write('b\n')
    expect(deflate).not.toHaveBeenCalled()
    await write('new\n')
    expect(deflate).toHaveBeenCalledTimes(1)
  })
})
