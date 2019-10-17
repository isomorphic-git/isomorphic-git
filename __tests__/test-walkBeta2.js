// @ts-nocheck
/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { walkBeta2, WORKDIR, TREE, STAGE } = require('isomorphic-git')

describe('walkBeta2', () => {
  it('can walk using WORKDIR, TREE, and STAGE', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-walkBeta1')
    // Test
    const matrix = await walkBeta2({
      fs,
      dir,
      gitdir,
      trees: [WORKDIR(), TREE({ ref: 'HEAD' }), STAGE()],
      map: entries =>
        entries.map(({ basename, exists, fullpath }) => ({
          basename,
          exists,
          fullpath
        }))
    })
    expect(matrix).toEqual([
      [
        { basename: '.', exists: true, fullpath: '.' },
        { basename: '.', exists: true, fullpath: '.' },
        { basename: '.', exists: true, fullpath: '.' }
      ],
      [
        { basename: 'a.txt', exists: true, fullpath: 'a.txt' },
        { basename: 'a.txt', exists: true, fullpath: 'a.txt' },
        { basename: 'a.txt', exists: true, fullpath: 'a.txt' }
      ],
      [
        { basename: 'b.txt', exists: true, fullpath: 'b.txt' },
        { basename: 'b.txt', exists: true, fullpath: 'b.txt' },
        { basename: 'b.txt', exists: true, fullpath: 'b.txt' }
      ],
      [
        { basename: 'c.txt', exists: false, fullpath: 'c.txt' },
        { basename: 'c.txt', exists: true, fullpath: 'c.txt' },
        { basename: 'c.txt', exists: true, fullpath: 'c.txt' }
      ],
      [
        { basename: 'd.txt', exists: true, fullpath: 'd.txt' },
        { basename: 'd.txt', exists: false, fullpath: 'd.txt' },
        { basename: 'd.txt', exists: false, fullpath: 'd.txt' }
      ]
    ])
  })

  it('can populate type, mode, oid, and content', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-walkBeta1')
    // BrowserFS has a design quirk where HTTPRequestFS has a default mode of 555 for everything,
    // meaning that files have the executable bit set by default!
    const isBrowserFS = !!fs._original_unwrapped_fs.getRootFS
    const FILEMODE = isBrowserFS ? 0o100755 : 0o100644
    // Test
    const matrix = await walkBeta2({
      fs,
      dir,
      gitdir,
      trees: [WORKDIR(), TREE({ ref: 'HEAD' }), STAGE()],
      map: entries =>
        Promise.all(
          entries.map(async entry => {
            const fullpath = entry.fullpath
            const exists = entry.exists
            const type = await entry.type()
            const mode = await entry.mode()
            const oid = await entry.oid()
            let content = await entry.content()
            if (content) content = content.toString('utf8')
            await entry.stat() // Not saving the results of stat bc it's pretty variable, but running it to check it doesn't fail
            return { fullpath, exists, type, mode, content, oid }
          })
        )
    })
    expect(matrix).toEqual([
      [
        {
          fullpath: '.',
          exists: true,
          type: 'tree',
          mode: 0o40000,
          content: undefined,
          oid: undefined
        },
        {
          fullpath: '.',
          exists: true,
          type: 'tree',
          mode: 0o40000,
          content: undefined,
          oid: 'a7ab08ac7277588e8ccb9b22047d6ebb751dee0f'
        },
        {
          fullpath: '.',
          exists: true,
          type: 'tree',
          mode: undefined,
          content: undefined,
          oid: undefined
        }
      ],
      [
        {
          fullpath: 'a.txt',
          exists: true,
          type: 'blob',
          mode: FILEMODE,
          content: 'Hello\n',
          oid: 'e965047ad7c57865823c7d992b1d046ea66edf78'
        },
        {
          fullpath: 'a.txt',
          exists: true,
          type: 'blob',
          mode: 0o100644,
          content: 'Hello\n',
          oid: 'e965047ad7c57865823c7d992b1d046ea66edf78'
        },
        {
          fullpath: 'a.txt',
          exists: true,
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: 'e965047ad7c57865823c7d992b1d046ea66edf78'
        }
      ],
      [
        {
          fullpath: 'b.txt',
          exists: true,
          type: 'blob',
          mode: FILEMODE,
          content: 'world!!!',
          oid: '77787b8f756d76b1d470f0dbb919d5d35dc55ef8'
        },
        {
          fullpath: 'b.txt',
          exists: true,
          type: 'blob',
          mode: 0o100644,
          content: 'world!',
          oid: 'c944ebc28f05731ef588ac6298485ba5e8bf3704'
        },
        {
          fullpath: 'b.txt',
          exists: true,
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: 'c944ebc28f05731ef588ac6298485ba5e8bf3704'
        }
      ],
      [
        {
          fullpath: 'c.txt',
          exists: false,
          type: undefined,
          mode: undefined,
          content: undefined,
          oid: undefined
        },
        {
          fullpath: 'c.txt',
          exists: true,
          type: 'blob',
          mode: 0o100644,
          content: '!!!',
          oid: '08faabdc782b92e1e8d371fdd13b30c0a3f54676'
        },
        {
          fullpath: 'c.txt',
          exists: true,
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: '08faabdc782b92e1e8d371fdd13b30c0a3f54676'
        }
      ],
      [
        {
          fullpath: 'd.txt',
          exists: true,
          type: 'blob',
          mode: FILEMODE,
          content: 'Hello again',
          oid: '895a23b41a53a99670b5fd4092e4199e3a328e02'
        },
        {
          fullpath: 'd.txt',
          exists: false,
          type: undefined,
          mode: undefined,
          content: undefined,
          oid: undefined
        },
        {
          fullpath: 'd.txt',
          exists: false,
          type: undefined,
          mode: undefined,
          content: undefined,
          oid: undefined
        }
      ]
    ])
  })
})
