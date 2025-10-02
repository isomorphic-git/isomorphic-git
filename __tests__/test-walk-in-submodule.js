// @ts-nocheck
/* eslint-env node, browser, jasmine */
const { walk, WORKDIR, TREE, STAGE, setConfig } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('walk', () => {
  ;(process.browser ? xit : it)(
    'can walk using WORKDIR, TREE, and STAGE',
    async () => {
      // Setup
      const { fs, dir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
        'test-walk'
      )
      // Test
      const matrix = await walk({
        fs,
        dir,
        gitdir: gitdirsmfullpath,
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
        ['.git', true, false, false],
        ['a.txt', true, true, true],
        ['b.txt', true, true, true],
        ['c.txt', false, true, true],
        ['d.txt', true, false, false],
        ['folder', true, true, true],
        ['folder/1.txt', true, true, true],
        ['folder/2.txt', true, false, false],
        ['folder/3.txt', true, false, true],
      ])
    }
  )
  ;(process.browser ? xit : it)(
    'can populate type, mode, oid, and content',
    async () => {
      // Setup
      const { fs, dir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
        'test-walk'
      )
      // BrowserFS has a design quirk where HTTPRequestFS has a default mode of 555 for everything,
      // meaning that files have the executable bit set by default!
      const isBrowserFS = !!fs._original_unwrapped_fs.getRootFS
      const FILEMODE = isBrowserFS ? 0o100755 : 0o100644
      const SYMLINKMODE = isBrowserFS ? 0o100755 : 0o120000
      // Test
      const matrix = await walk({
        fs,
        dir,
        gitdir: gitdirsmfullpath,
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
          '.git',
          {
            type: 'blob',
            mode: FILEMODE,
            content: 'gitdir: ../.git/modules/mysubmodule\n',
            oid: 'fcef7abb5d2b9a5d89a44d8d5b487349018ba04b',
            hasStat: true,
          },
          null,
          null,
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
    }
  )
  ;(process.browser ? xit : it)(
    'autocrlf respected when gitconfig changes',
    async () => {
      // Setup
      const { fs, dir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
        'test-walk'
      )
      // BrowserFS has a design quirk where HTTPRequestFS has a default mode of 555 for everything,
      // meaning that files have the executable bit set by default!

      const isBrowserFS = !!fs._original_unwrapped_fs.getRootFS
      const FILEMODE = isBrowserFS ? 0o100755 : 0o100644
      const SYMLINKMODE = isBrowserFS ? 0o100755 : 0o120000
      const toWalkerResult = async walker => {
        return {
          type: await walker.type(),
          mode: await walker.mode(),
          oid: await walker.oid(),
          content:
            (await walker.content()) &&
            Buffer.from(await walker.content()).toString('utf8'),
          hasStat: !!(await walker.stat()),
        }
      }

      // Test
      let matrix = await walk({
        fs,
        dir,
        gitdir: gitdirsmfullpath,
        trees: [WORKDIR(), TREE({ ref: 'HEAD' }), STAGE()],
        map: async (filepath, [workdir, tree, stage]) => [
          filepath,
          workdir && (await toWalkerResult(workdir)),
          tree && (await toWalkerResult(tree)),
          stage && (await toWalkerResult(stage)),
        ],
      })

      const expectedMatrix = [
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
          '.git',
          {
            type: 'blob',
            mode: FILEMODE,
            content: 'gitdir: ../.git/modules/mysubmodule\n',
            oid: 'fcef7abb5d2b9a5d89a44d8d5b487349018ba04b',
            hasStat: true,
          },
          null,
          null,
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
      ]
      expect(matrix).toEqual(expectedMatrix)

      // Check oid + content updates when changing autocrlf to true
      await setConfig({
        fs,
        gitdir: gitdirsmfullpath,
        path: 'core.autocrlf',
        value: true,
      })
      await fs.write(dir + '/a.txt', 'Hello\r\nagain', {
        mode: 0o666,
      })

      matrix = await walk({
        fs,
        dir,
        gitdir: gitdirsmfullpath,
        trees: [WORKDIR(), TREE({ ref: 'HEAD' }), STAGE()],
        map: async (filepath, [workdir, tree, stage]) => [
          filepath,
          workdir && (await toWalkerResult(workdir)),
          tree && (await toWalkerResult(tree)),
          stage && (await toWalkerResult(stage)),
        ],
      })

      // core.autocrlf is true \r\n should be replaced with \n
      expectedMatrix[2][1] = {
        type: 'blob',
        mode: 0o100644,
        content: 'Hello\nagain',
        oid: 'e855bd8b67cc7ee321e4dec1b9e5b17e13aec8e1',
        hasStat: true,
      }
      expectedMatrix[2][3].mode = FILEMODE
      expectedMatrix[7][3].mode = FILEMODE
      expect(matrix).toEqual(expectedMatrix)

      // Check oid + content updates when changing autocrlf back to false
      await setConfig({
        fs,
        gitdir: gitdirsmfullpath,
        path: 'core.autocrlf',
        value: false,
      })

      matrix = await walk({
        fs,
        dir,
        gitdir: gitdirsmfullpath,
        trees: [WORKDIR(), TREE({ ref: 'HEAD' }), STAGE()],
        map: async (filepath, [workdir, tree, stage]) => [
          filepath,
          workdir && (await toWalkerResult(workdir)),
          tree && (await toWalkerResult(tree)),
          stage && (await toWalkerResult(stage)),
        ],
      })

      // core.autocrlf is false \r\n should not be replaced with \n
      expectedMatrix[2][1] = {
        type: 'blob',
        mode: 0o100644,
        content: 'Hello\r\nagain',
        oid: '8d4f7af538be6af26291dc33eb1fde39b558dbea',
        hasStat: true,
      }
      expect(matrix).toEqual(expectedMatrix)
    }
  )
})
