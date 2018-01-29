/* global test describe expect */
import { utils } from '../dist/for-node/internal-apis'
const { flatFileListToDirectoryStructure } = utils

describe('flatFileListToDirectoryStructure', () => {
  test('simple', async () => {
    let inode = flatFileListToDirectoryStructure([{ path: 'hello/there.txt' }])
    expect(inode.fullpath === '.').toBe(true)
    expect(inode.type === 'tree').toBe(true)
    expect(inode.children.length === 1).toBe(true)
    let hello = inode.children[0]
    expect(hello.type === 'tree').toBe(true)
    expect(hello.fullpath === 'hello').toBe(true)
    expect(hello.basename === 'hello').toBe(true)
    expect(hello.parent === inode).toBe(true)
    expect(hello.children.length === 1).toBe(true)
    let there = hello.children[0]
    expect(there.type === 'blob').toBe(true)
    expect(there.fullpath === 'hello/there.txt').toBe(true)
    expect(there.basename === 'there.txt').toBe(true)
  })

  test('advanced', async () => {
    let filelist = [
      '.babelrc',
      '.editorconfig',
      '.flowconfig',
      '.gitignore',
      '.travis.yml',
      'LICENSE.md',
      'README.md',
      'package-lock.json',
      'package.json',
      'shrinkwrap.yaml',
      'src/commands/checkout.js',
      'src/commands/config.js',
      'src/commands/fetch.js',
      'src/commands/init.js',
      'src/index.js',
      'src/models/GitBlob.js',
      'src/models/GitCommit.js',
      'src/models/GitConfig.js',
      'src/models/GitObject.js',
      'src/models/GitTree.js',
      'src/utils/exists.js',
      'src/utils/mkdirs.js',
      'src/utils/read.js',
      'src/utils/resolveRef.js',
      'src/utils/write.js',
      'test/_helpers.js',
      'test/snapshots/test-resolveRef.js.md',
      'test/snapshots/test-resolveRef.js.snap',
      'test/test-clone.js',
      'test/test-config.js',
      'test/test-init.js',
      'test/test-resolveRef.js'
    ]
    let files = filelist.map(f => ({ path: f, someMeta: f.length }))
    let inodes = flatFileListToDirectoryStructure(files)
    expect(inodes).toMatchSnapshot()
  })
})
