// @ts-nocheck
/* eslint-env node, browser, jasmine */
const { walk, WORKDIR, TREE, STAGE } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('walk', () => {
  it('can walk using WORKDIR, TREE, and STAGE', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-walk')
    // Test
    const matrix = await walk({
      fs,
      dir,
      gitdir,
      trees: [WORKDIR(), TREE(), STAGE()],
      map: (filepath, [workdir, tree, stage]) => [
        filepath,
        !!workdir,
        !!tree,
        !!stage,
      ],
    })
    expect(matrix).toEqual([
      ['.', true, true, true],
      ['a.txt', true, true, true],
      ['b.txt', true, true, true],
      ['c.txt', false, true, true],
      ['d.txt', true, false, false],
      ['folder', true, true, true],
      ['folder/1.txt', true, true, true],
      ['folder/2.txt', true, false, false],
      ['folder/3.txt', true, false, true],
    ])
  })

  it('can populate type, mode, oid, and content', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-walk')
    // BrowserFS has a design quirk where HTTPRequestFS has a default mode of 555 for everything,
    // meaning that files have the executable bit set by default!
    const isBrowserFS = !!fs._original_unwrapped_fs.getRootFS
    const FILEMODE = isBrowserFS ? 0o100755 : 0o100644
    const SYMLINKMODE = isBrowserFS ? 0o100755 : 0o120000
    // Test
    const matrix = await walk({
      fs,
      dir,
      gitdir,
      trees: [WORKDIR(), TREE({ ref: 'HEAD' }), STAGE()],
      map: async (filepath, [workdir, tree, stage]) => [
        filepath,
        workdir && {
          type: await workdir.type(),
          mode: await workdir.mode(),
          oid: await workdir.oid(),
          content:
            (await workdir.content()) &&
            Buffer.from(await workdir.content()).toString('utf8'),
          hasStat: !!(await workdir.stat()),
        },
        tree && {
          type: await tree.type(),
          mode: await tree.mode(),
          oid: await tree.oid(),
          content:
            (await tree.content()) &&
            Buffer.from(await tree.content()).toString('utf8'),
          hasStat: !!(await tree.stat()),
        },
        stage && {
          type: await stage.type(),
          mode: await stage.mode(),
          oid: await stage.oid(),
          content:
            (await stage.content()) &&
            Buffer.from(await stage.content()).toString('utf8'),
          hasStat: !!(await stage.stat()),
        },
      ],
    })
    expect(matrix).toEqual([
      [
        '.',
        {
          type: 'tree',
          mode: 0o40000,
          content: undefined,
          oid: undefined,
          hasStat: true,
        },
        {
          type: 'tree',
          mode: 0o40000,
          content: undefined,
          oid: '49a23584c8bc3a928250e5fd164131f2eb0f2e4c',
          hasStat: false,
        },
        {
          type: 'tree',
          mode: undefined,
          content: undefined,
          oid: undefined,
          hasStat: false,
        },
      ],
      [
        'a.txt',
        {
          type: 'blob',
          mode: FILEMODE,
          content: 'Hello\n',
          oid: 'e965047ad7c57865823c7d992b1d046ea66edf78',
          hasStat: true,
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: 'Hello\n',
          oid: 'e965047ad7c57865823c7d992b1d046ea66edf78',
          hasStat: false,
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: 'e965047ad7c57865823c7d992b1d046ea66edf78',
          hasStat: true,
        },
      ],
      [
        'b.txt',
        {
          type: 'blob',
          mode: FILEMODE,
          content: 'world!!!',
          oid: '77787b8f756d76b1d470f0dbb919d5d35dc55ef8',
          hasStat: true,
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: 'world!',
          oid: 'c944ebc28f05731ef588ac6298485ba5e8bf3704',
          hasStat: false,
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: 'c944ebc28f05731ef588ac6298485ba5e8bf3704',
          hasStat: true,
        },
      ],
      [
        'c.txt',
        null,
        {
          type: 'blob',
          mode: 0o100644,
          content: '!!!',
          oid: '08faabdc782b92e1e8d371fdd13b30c0a3f54676',
          hasStat: false,
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: '08faabdc782b92e1e8d371fdd13b30c0a3f54676',
          hasStat: true,
        },
      ],
      [
        'd.txt',
        {
          type: 'blob',
          mode: FILEMODE,
          content: 'Hello again',
          oid: '895a23b41a53a99670b5fd4092e4199e3a328e02',
          hasStat: true,
        },
        null,
        null,
      ],
      [
        'folder',
        {
          type: 'tree',
          mode: 0o40000,
          content: undefined,
          oid: undefined,
          hasStat: true,
        },
        {
          type: 'tree',
          mode: 0o40000,
          content: undefined,
          oid: '341e54913a3a43069f2927cc0f703e5a9f730df1',
          hasStat: false,
        },
        {
          type: 'tree',
          mode: undefined,
          content: undefined,
          oid: undefined,
          hasStat: false,
        },
      ],
      [
        'folder/1.txt',
        {
          type: 'blob',
          mode: FILEMODE,
          content: '',
          oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
          hasStat: true,
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: '',
          oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
          hasStat: false,
        },
        {
          type: 'blob',
          mode: 0o100644,
          content: undefined,
          oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
          hasStat: true,
        },
      ],
      [
        'folder/2.txt',
        {
          type: 'blob',
          mode: FILEMODE,
          content: '',
          oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
          hasStat: true,
        },
        null,
        null,
      ],
      [
        'folder/3.txt',
        {
          type: 'blob',
          mode: SYMLINKMODE,
          content: '',
          oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
          hasStat: true,
        },
        null,
        {
          type: 'blob',
          mode: 0o120000,
          content: undefined,
          oid: '7999426c516ffbbae9136d93dc44e89091d35a13',
          hasStat: true,
        },
      ],
    ])
  })
})
