/* eslint-env node, browser, jasmine */
import { flatFileListToDirectoryStructure } from 'isomorphic-git/internal-apis'

describe('flatFileListToDirectoryStructure', () => {
  it('simple', async () => {
    const inode = flatFileListToDirectoryStructure([
      { path: 'hello/there.txt' },
    ]).get('.')
    expect(inode.fullpath).toBe('.')
    expect(inode.type).toBe('tree')
    expect(inode.children.length).toBe(1)
    const hello = inode.children[0]
    expect(hello.type).toBe('tree')
    expect(hello.fullpath).toBe('hello')
    expect(hello.basename).toBe('hello')
    expect(hello.parent).toBe(inode)
    expect(hello.children.length).toBe(1)
    const there = hello.children[0]
    expect(there.type).toBe('blob')
    expect(there.fullpath).toBe('hello/there.txt')
    expect(there.basename).toBe('there.txt')
  })

  it('advanced', async () => {
    const filelist = [
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
      'test/test-resolveRef.js',
    ]
    const files = filelist.map(f => ({ path: f, someMeta: f.length }))
    const inodes = flatFileListToDirectoryStructure(files)
    expect(inodes.get('.')).toMatchInlineSnapshot(`
      {
        "basename": ".",
        "children": [
          {
            "basename": ".babelrc",
            "children": [],
            "fullpath": ".babelrc",
            "metadata": {
              "path": ".babelrc",
              "someMeta": 8,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": ".editorconfig",
            "children": [],
            "fullpath": ".editorconfig",
            "metadata": {
              "path": ".editorconfig",
              "someMeta": 13,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": ".flowconfig",
            "children": [],
            "fullpath": ".flowconfig",
            "metadata": {
              "path": ".flowconfig",
              "someMeta": 11,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": ".gitignore",
            "children": [],
            "fullpath": ".gitignore",
            "metadata": {
              "path": ".gitignore",
              "someMeta": 10,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": ".travis.yml",
            "children": [],
            "fullpath": ".travis.yml",
            "metadata": {
              "path": ".travis.yml",
              "someMeta": 11,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": "LICENSE.md",
            "children": [],
            "fullpath": "LICENSE.md",
            "metadata": {
              "path": "LICENSE.md",
              "someMeta": 10,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": "README.md",
            "children": [],
            "fullpath": "README.md",
            "metadata": {
              "path": "README.md",
              "someMeta": 9,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": "package-lock.json",
            "children": [],
            "fullpath": "package-lock.json",
            "metadata": {
              "path": "package-lock.json",
              "someMeta": 17,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": "package.json",
            "children": [],
            "fullpath": "package.json",
            "metadata": {
              "path": "package.json",
              "someMeta": 12,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": "shrinkwrap.yaml",
            "children": [],
            "fullpath": "shrinkwrap.yaml",
            "metadata": {
              "path": "shrinkwrap.yaml",
              "someMeta": 15,
            },
            "parent": [Circular],
            "type": "blob",
          },
          {
            "basename": "src",
            "children": [
              {
                "basename": "commands",
                "children": [
                  {
                    "basename": "checkout.js",
                    "children": [],
                    "fullpath": "src/commands/checkout.js",
                    "metadata": {
                      "path": "src/commands/checkout.js",
                      "someMeta": 24,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "config.js",
                    "children": [],
                    "fullpath": "src/commands/config.js",
                    "metadata": {
                      "path": "src/commands/config.js",
                      "someMeta": 22,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "fetch.js",
                    "children": [],
                    "fullpath": "src/commands/fetch.js",
                    "metadata": {
                      "path": "src/commands/fetch.js",
                      "someMeta": 21,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "init.js",
                    "children": [],
                    "fullpath": "src/commands/init.js",
                    "metadata": {
                      "path": "src/commands/init.js",
                      "someMeta": 20,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                ],
                "fullpath": "src/commands",
                "metadata": {},
                "parent": [Circular],
                "type": "tree",
              },
              {
                "basename": "index.js",
                "children": [],
                "fullpath": "src/index.js",
                "metadata": {
                  "path": "src/index.js",
                  "someMeta": 12,
                },
                "parent": [Circular],
                "type": "blob",
              },
              {
                "basename": "models",
                "children": [
                  {
                    "basename": "GitBlob.js",
                    "children": [],
                    "fullpath": "src/models/GitBlob.js",
                    "metadata": {
                      "path": "src/models/GitBlob.js",
                      "someMeta": 21,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "GitCommit.js",
                    "children": [],
                    "fullpath": "src/models/GitCommit.js",
                    "metadata": {
                      "path": "src/models/GitCommit.js",
                      "someMeta": 23,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "GitConfig.js",
                    "children": [],
                    "fullpath": "src/models/GitConfig.js",
                    "metadata": {
                      "path": "src/models/GitConfig.js",
                      "someMeta": 23,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "GitObject.js",
                    "children": [],
                    "fullpath": "src/models/GitObject.js",
                    "metadata": {
                      "path": "src/models/GitObject.js",
                      "someMeta": 23,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "GitTree.js",
                    "children": [],
                    "fullpath": "src/models/GitTree.js",
                    "metadata": {
                      "path": "src/models/GitTree.js",
                      "someMeta": 21,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                ],
                "fullpath": "src/models",
                "metadata": {},
                "parent": [Circular],
                "type": "tree",
              },
              {
                "basename": "utils",
                "children": [
                  {
                    "basename": "exists.js",
                    "children": [],
                    "fullpath": "src/utils/exists.js",
                    "metadata": {
                      "path": "src/utils/exists.js",
                      "someMeta": 19,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "mkdirs.js",
                    "children": [],
                    "fullpath": "src/utils/mkdirs.js",
                    "metadata": {
                      "path": "src/utils/mkdirs.js",
                      "someMeta": 19,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "read.js",
                    "children": [],
                    "fullpath": "src/utils/read.js",
                    "metadata": {
                      "path": "src/utils/read.js",
                      "someMeta": 17,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "resolveRef.js",
                    "children": [],
                    "fullpath": "src/utils/resolveRef.js",
                    "metadata": {
                      "path": "src/utils/resolveRef.js",
                      "someMeta": 23,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "write.js",
                    "children": [],
                    "fullpath": "src/utils/write.js",
                    "metadata": {
                      "path": "src/utils/write.js",
                      "someMeta": 18,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                ],
                "fullpath": "src/utils",
                "metadata": {},
                "parent": [Circular],
                "type": "tree",
              },
            ],
            "fullpath": "src",
            "metadata": {},
            "parent": [Circular],
            "type": "tree",
          },
          {
            "basename": "test",
            "children": [
              {
                "basename": "_helpers.js",
                "children": [],
                "fullpath": "test/_helpers.js",
                "metadata": {
                  "path": "test/_helpers.js",
                  "someMeta": 16,
                },
                "parent": [Circular],
                "type": "blob",
              },
              {
                "basename": "snapshots",
                "children": [
                  {
                    "basename": "test-resolveRef.js.md",
                    "children": [],
                    "fullpath": "test/snapshots/test-resolveRef.js.md",
                    "metadata": {
                      "path": "test/snapshots/test-resolveRef.js.md",
                      "someMeta": 36,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  {
                    "basename": "test-resolveRef.js.snap",
                    "children": [],
                    "fullpath": "test/snapshots/test-resolveRef.js.snap",
                    "metadata": {
                      "path": "test/snapshots/test-resolveRef.js.snap",
                      "someMeta": 38,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                ],
                "fullpath": "test/snapshots",
                "metadata": {},
                "parent": [Circular],
                "type": "tree",
              },
              {
                "basename": "test-clone.js",
                "children": [],
                "fullpath": "test/test-clone.js",
                "metadata": {
                  "path": "test/test-clone.js",
                  "someMeta": 18,
                },
                "parent": [Circular],
                "type": "blob",
              },
              {
                "basename": "test-config.js",
                "children": [],
                "fullpath": "test/test-config.js",
                "metadata": {
                  "path": "test/test-config.js",
                  "someMeta": 19,
                },
                "parent": [Circular],
                "type": "blob",
              },
              {
                "basename": "test-init.js",
                "children": [],
                "fullpath": "test/test-init.js",
                "metadata": {
                  "path": "test/test-init.js",
                  "someMeta": 17,
                },
                "parent": [Circular],
                "type": "blob",
              },
              {
                "basename": "test-resolveRef.js",
                "children": [],
                "fullpath": "test/test-resolveRef.js",
                "metadata": {
                  "path": "test/test-resolveRef.js",
                  "someMeta": 23,
                },
                "parent": [Circular],
                "type": "blob",
              },
            ],
            "fullpath": "test",
            "metadata": {},
            "parent": [Circular],
            "type": "tree",
          },
        ],
        "fullpath": ".",
        "metadata": {},
        "parent": [Circular],
        "type": "tree",
      }
    `)
  })
})
