/* eslint-env node, browser, jasmine */
const { remove, listFiles } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('remove', () => {
  it('file', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-remove')
    // Test
    const before = await listFiles({ fs, gitdir })
    expect(before).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        ".travis.yml",
        "LICENSE.md",
        "package-lock.json",
        "package.json",
        "shrinkwrap.yaml",
        "src/commands/checkout.js",
        "src/commands/config.js",
        "src/commands/fetch.js",
        "src/commands/init.js",
        "src/index.js",
        "src/models/GitBlob.js",
        "src/models/GitCommit.js",
        "src/models/GitConfig.js",
        "src/models/GitObject.js",
        "src/models/GitTree.js",
        "src/utils/exists.js",
        "src/utils/mkdirs.js",
        "src/utils/read.js",
        "src/utils/resolveRef.js",
        "src/utils/write.js",
      ]
    `)
    await remove({ fs, gitdir, filepath: 'LICENSE.md' })
    const after = await listFiles({ fs, gitdir })
    expect(after).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        ".travis.yml",
        "package-lock.json",
        "package.json",
        "shrinkwrap.yaml",
        "src/commands/checkout.js",
        "src/commands/config.js",
        "src/commands/fetch.js",
        "src/commands/init.js",
        "src/index.js",
        "src/models/GitBlob.js",
        "src/models/GitCommit.js",
        "src/models/GitConfig.js",
        "src/models/GitObject.js",
        "src/models/GitTree.js",
        "src/utils/exists.js",
        "src/utils/mkdirs.js",
        "src/utils/read.js",
        "src/utils/resolveRef.js",
        "src/utils/write.js",
      ]
    `)
    expect(before.length === after.length + 1).toBe(true)
  })
  it('dir', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-remove')
    // Test
    const before = await listFiles({ fs, gitdir })
    expect(before).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        ".travis.yml",
        "LICENSE.md",
        "package-lock.json",
        "package.json",
        "shrinkwrap.yaml",
        "src/commands/checkout.js",
        "src/commands/config.js",
        "src/commands/fetch.js",
        "src/commands/init.js",
        "src/index.js",
        "src/models/GitBlob.js",
        "src/models/GitCommit.js",
        "src/models/GitConfig.js",
        "src/models/GitObject.js",
        "src/models/GitTree.js",
        "src/utils/exists.js",
        "src/utils/mkdirs.js",
        "src/utils/read.js",
        "src/utils/resolveRef.js",
        "src/utils/write.js",
      ]
    `)
    await remove({ fs, gitdir, filepath: 'src/models' })
    const after = await listFiles({ fs, gitdir })
    expect(after).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        ".travis.yml",
        "LICENSE.md",
        "package-lock.json",
        "package.json",
        "shrinkwrap.yaml",
        "src/commands/checkout.js",
        "src/commands/config.js",
        "src/commands/fetch.js",
        "src/commands/init.js",
        "src/index.js",
        "src/utils/exists.js",
        "src/utils/mkdirs.js",
        "src/utils/read.js",
        "src/utils/resolveRef.js",
        "src/utils/write.js",
      ]
    `)
    expect(before.length === after.length + 5).toBe(true)
  })
})
