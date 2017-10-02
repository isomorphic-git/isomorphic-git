import test from 'ava'
import { flatFileListToDirectoryStructure } from '../dist/for-node/utils'

test('flatFileListToDirectoryStructure', async t => {
  let inode = flatFileListToDirectoryStructure([{ path: 'hello/there.txt' }])
  t.true(inode.fullpath === '.')
  t.true(inode.type === 'tree')
  t.true(inode.children.length === 1)
  let hello = inode.children[0]
  t.true(hello.type === 'tree')
  t.true(hello.fullpath === 'hello')
  t.true(hello.basename === 'hello')
  t.true(hello.parent === inode)
  t.true(hello.children.length === 1)
  let there = hello.children[0]
  t.true(there.type === 'blob')
  t.true(there.fullpath === 'hello/there.txt')
  t.true(there.basename === 'there.txt')
})

test('flatFileListToDirectoryStructure advanced', async t => {
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
  t.snapshot(inodes)
})
