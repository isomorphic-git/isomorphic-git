/* eslint-env node, browser, jasmine */
const { listFiles } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('listFiles', () => {
  it('index', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listFiles')
    // Test
    const files = await listFiles({ fs, gitdir })
    expect(files).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        ".travis.yml",
        "LICENSE.md",
        "README.md",
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
        "test/_helpers.js",
        "test/snapshots/test-resolveRef.js.md",
        "test/snapshots/test-resolveRef.js.snap",
        "test/test-clone.js",
        "test/test-config.js",
        "test/test-init.js",
        "test/test-resolveRef.js",
      ]
    `)
  })
  it('ref', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-checkout')
    // Test
    const files = await listFiles({ fs, gitdir, ref: 'test-branch' })
    expect(files).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        "LICENSE.md",
        "README.md",
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
        "src/models/GitTree.js",
        "src/utils/combinePayloadAndSignature.js",
        "src/utils/commitSha.js",
        "src/utils/exists.js",
        "src/utils/mkdirs.js",
        "src/utils/read.js",
        "src/utils/resolveRef.js",
        "src/utils/unwrapObject.js",
        "src/utils/wrapCommit.js",
        "src/utils/write.js",
        "test/resolveRef.js",
        "test/smoke.js",
        "test/snapshots/resolveRef.js.md",
        "test/snapshots/resolveRef.js.snap",
      ]
    `)
  })
})
