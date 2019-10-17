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
      map: ([fullpath, workdir, tree, stage]) => [fullpath, !!workdir, !!tree, !!stage]
    })
    expect(matrix).toEqual([
      [ '.', true, true, true ],
      [ 'a.txt', true, true, true ],
      [ 'b.txt', true, true, true ],
      [ 'c.txt', false, true, true ],
      [ 'd.txt', true, false, false ]
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
      map: async ([fullpath, workdir, tree, stage]) => [
        fullpath,
        workdir && {
          type: await workdir.type(),
          mode: await workdir.mode(),
          oid: await workdir.oid(),
          content: await workdir.content() && (await workdir.content()).toString('utf8')
        },
        tree && {
          type: await tree.type(),
          mode: await tree.mode(),
          oid: await tree.oid(),
          content: await tree.content() && (await tree.content()).toString('utf8')
        },
        stage && {
          type: await stage.type(),
          mode: await stage.mode(),
          oid: await stage.oid(),
          content: await stage.content() && (await stage.content()).toString('utf8')
        }
      ]
    })
    expect(matrix).toEqual([
      [
        '.',
        {
          type: 'tree',
          mode: 0o40000,
          content: undefined,
          oid: undefined
        },
        {
          type: 'tree',
          mode: 0o40000,
          content: undefined,
          oid: 'a7ab08ac7277588e8ccb9b22047d6ebb751dee0f'
        },
        {
          type: 'tree',
          mode: undefined,
          content: undefined,
          oid: undefined
        }
      ],
      [
        'a.txt',
        {
          type: 'blob',
          mode: FILEMODE,
          content: 'Hello\n',
          oid: 'e965047ad7c57865823c7d992b1d046ea66edf78'
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: 'Hello\n',
          oid: 'e965047ad7c57865823c7d992b1d046ea66edf78'
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: 'e965047ad7c57865823c7d992b1d046ea66edf78'
        }
      ],
      [
        'b.txt',
        {
          type: 'blob',
          mode: FILEMODE,
          content: 'world!!!',
          oid: '77787b8f756d76b1d470f0dbb919d5d35dc55ef8'
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: 'world!',
          oid: 'c944ebc28f05731ef588ac6298485ba5e8bf3704'
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: 'c944ebc28f05731ef588ac6298485ba5e8bf3704'
        }
      ],
      [
        'c.txt',
        null,
        {
          type: 'blob',
          mode: 0o100644,
          content: '!!!',
          oid: '08faabdc782b92e1e8d371fdd13b30c0a3f54676'
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: '08faabdc782b92e1e8d371fdd13b30c0a3f54676'
        }
      ],
      [
        'd.txt',
        {
          type: 'blob',
          mode: FILEMODE,
          content: 'Hello again',
          oid: '895a23b41a53a99670b5fd4092e4199e3a328e02'
        },
        null,
        null
      ]
    ])
  })
})
