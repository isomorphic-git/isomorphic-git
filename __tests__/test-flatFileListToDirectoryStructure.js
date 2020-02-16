/* eslint-env node, browser, jasmine */
const {
  flatFileListToDirectoryStructure,
} = require('isomorphic-git/internal-apis')

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
      Object {
        "basename": ".",
        "children": Array [
          Object {
            "basename": ".babelrc",
            "children": Array [],
            "fullpath": ".babelrc",
            "metadata": Object {
              "path": ".babelrc",
              "someMeta": 8,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": ".editorconfig",
            "children": Array [],
            "fullpath": ".editorconfig",
            "metadata": Object {
              "path": ".editorconfig",
              "someMeta": 13,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": ".flowconfig",
            "children": Array [],
            "fullpath": ".flowconfig",
            "metadata": Object {
              "path": ".flowconfig",
              "someMeta": 11,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": ".gitignore",
            "children": Array [],
            "fullpath": ".gitignore",
            "metadata": Object {
              "path": ".gitignore",
              "someMeta": 10,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": ".travis.yml",
            "children": Array [],
            "fullpath": ".travis.yml",
            "metadata": Object {
              "path": ".travis.yml",
              "someMeta": 11,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": "LICENSE.md",
            "children": Array [],
            "fullpath": "LICENSE.md",
            "metadata": Object {
              "path": "LICENSE.md",
              "someMeta": 10,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": "README.md",
            "children": Array [],
            "fullpath": "README.md",
            "metadata": Object {
              "path": "README.md",
              "someMeta": 9,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": "package-lock.json",
            "children": Array [],
            "fullpath": "package-lock.json",
            "metadata": Object {
              "path": "package-lock.json",
              "someMeta": 17,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": "package.json",
            "children": Array [],
            "fullpath": "package.json",
            "metadata": Object {
              "path": "package.json",
              "someMeta": 12,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": "shrinkwrap.yaml",
            "children": Array [],
            "fullpath": "shrinkwrap.yaml",
            "metadata": Object {
              "path": "shrinkwrap.yaml",
              "someMeta": 15,
            },
            "parent": [Circular],
            "type": "blob",
          },
          Object {
            "basename": "src",
            "children": Array [
              Object {
                "basename": "commands",
                "children": Array [
                  Object {
                    "basename": "checkout.js",
                    "children": Array [],
                    "fullpath": "src/commands/checkout.js",
                    "metadata": Object {
                      "path": "src/commands/checkout.js",
                      "someMeta": 24,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "config.js",
                    "children": Array [],
                    "fullpath": "src/commands/config.js",
                    "metadata": Object {
                      "path": "src/commands/config.js",
                      "someMeta": 22,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "fetch.js",
                    "children": Array [],
                    "fullpath": "src/commands/fetch.js",
                    "metadata": Object {
                      "path": "src/commands/fetch.js",
                      "someMeta": 21,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "init.js",
                    "children": Array [],
                    "fullpath": "src/commands/init.js",
                    "metadata": Object {
                      "path": "src/commands/init.js",
                      "someMeta": 20,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                ],
                "fullpath": "src/commands",
                "metadata": Object {},
                "parent": [Circular],
                "type": "tree",
              },
              Object {
                "basename": "index.js",
                "children": Array [],
                "fullpath": "src/index.js",
                "metadata": Object {
                  "path": "src/index.js",
                  "someMeta": 12,
                },
                "parent": [Circular],
                "type": "blob",
              },
              Object {
                "basename": "models",
                "children": Array [
                  Object {
                    "basename": "GitBlob.js",
                    "children": Array [],
                    "fullpath": "src/models/GitBlob.js",
                    "metadata": Object {
                      "path": "src/models/GitBlob.js",
                      "someMeta": 21,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "GitCommit.js",
                    "children": Array [],
                    "fullpath": "src/models/GitCommit.js",
                    "metadata": Object {
                      "path": "src/models/GitCommit.js",
                      "someMeta": 23,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "GitConfig.js",
                    "children": Array [],
                    "fullpath": "src/models/GitConfig.js",
                    "metadata": Object {
                      "path": "src/models/GitConfig.js",
                      "someMeta": 23,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "GitObject.js",
                    "children": Array [],
                    "fullpath": "src/models/GitObject.js",
                    "metadata": Object {
                      "path": "src/models/GitObject.js",
                      "someMeta": 23,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "GitTree.js",
                    "children": Array [],
                    "fullpath": "src/models/GitTree.js",
                    "metadata": Object {
                      "path": "src/models/GitTree.js",
                      "someMeta": 21,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                ],
                "fullpath": "src/models",
                "metadata": Object {},
                "parent": [Circular],
                "type": "tree",
              },
              Object {
                "basename": "utils",
                "children": Array [
                  Object {
                    "basename": "exists.js",
                    "children": Array [],
                    "fullpath": "src/utils/exists.js",
                    "metadata": Object {
                      "path": "src/utils/exists.js",
                      "someMeta": 19,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "mkdirs.js",
                    "children": Array [],
                    "fullpath": "src/utils/mkdirs.js",
                    "metadata": Object {
                      "path": "src/utils/mkdirs.js",
                      "someMeta": 19,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "read.js",
                    "children": Array [],
                    "fullpath": "src/utils/read.js",
                    "metadata": Object {
                      "path": "src/utils/read.js",
                      "someMeta": 17,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "resolveRef.js",
                    "children": Array [],
                    "fullpath": "src/utils/resolveRef.js",
                    "metadata": Object {
                      "path": "src/utils/resolveRef.js",
                      "someMeta": 23,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "write.js",
                    "children": Array [],
                    "fullpath": "src/utils/write.js",
                    "metadata": Object {
                      "path": "src/utils/write.js",
                      "someMeta": 18,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                ],
                "fullpath": "src/utils",
                "metadata": Object {},
                "parent": [Circular],
                "type": "tree",
              },
            ],
            "fullpath": "src",
            "metadata": Object {},
            "parent": [Circular],
            "type": "tree",
          },
          Object {
            "basename": "test",
            "children": Array [
              Object {
                "basename": "_helpers.js",
                "children": Array [],
                "fullpath": "test/_helpers.js",
                "metadata": Object {
                  "path": "test/_helpers.js",
                  "someMeta": 16,
                },
                "parent": [Circular],
                "type": "blob",
              },
              Object {
                "basename": "snapshots",
                "children": Array [
                  Object {
                    "basename": "test-resolveRef.js.md",
                    "children": Array [],
                    "fullpath": "test/snapshots/test-resolveRef.js.md",
                    "metadata": Object {
                      "path": "test/snapshots/test-resolveRef.js.md",
                      "someMeta": 36,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                  Object {
                    "basename": "test-resolveRef.js.snap",
                    "children": Array [],
                    "fullpath": "test/snapshots/test-resolveRef.js.snap",
                    "metadata": Object {
                      "path": "test/snapshots/test-resolveRef.js.snap",
                      "someMeta": 38,
                    },
                    "parent": [Circular],
                    "type": "blob",
                  },
                ],
                "fullpath": "test/snapshots",
                "metadata": Object {},
                "parent": [Circular],
                "type": "tree",
              },
              Object {
                "basename": "test-clone.js",
                "children": Array [],
                "fullpath": "test/test-clone.js",
                "metadata": Object {
                  "path": "test/test-clone.js",
                  "someMeta": 18,
                },
                "parent": [Circular],
                "type": "blob",
              },
              Object {
                "basename": "test-config.js",
                "children": Array [],
                "fullpath": "test/test-config.js",
                "metadata": Object {
                  "path": "test/test-config.js",
                  "someMeta": 19,
                },
                "parent": [Circular],
                "type": "blob",
              },
              Object {
                "basename": "test-init.js",
                "children": Array [],
                "fullpath": "test/test-init.js",
                "metadata": Object {
                  "path": "test/test-init.js",
                  "someMeta": 17,
                },
                "parent": [Circular],
                "type": "blob",
              },
              Object {
                "basename": "test-resolveRef.js",
                "children": Array [],
                "fullpath": "test/test-resolveRef.js",
                "metadata": Object {
                  "path": "test/test-resolveRef.js",
                  "someMeta": 23,
                },
                "parent": [Circular],
                "type": "blob",
              },
            ],
            "fullpath": "test",
            "metadata": Object {},
            "parent": [Circular],
            "type": "tree",
          },
        ],
        "fullpath": ".",
        "metadata": Object {},
        "parent": [Circular],
        "type": "tree",
      }
    `)
  })
})
