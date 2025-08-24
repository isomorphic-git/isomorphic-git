/* eslint-env node, browser, jasmine */

const path = require('path')

const { GitIndex, GitIndexManager } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('GitIndex', () => {
  it('GitIndex.from(buffer) - Simple', async () => {
    const { fs, dir } = await makeFixture('test-GitIndex')
    const buffer = await fs.read(path.join(dir, 'simple-index'))
    const index = await GitIndex.from(buffer)
    const rendering = index.render()
    expect(rendering).toMatchInlineSnapshot(
      '"100644 323fae03f4606ea9991df8befbb2fca795e648fa    world.txt"'
    )
    const buffer2 = await index.toObject()
    expect(buffer.slice(0, buffer2.length - 20)).toEqual(buffer2.slice(0, -20))
  })

  it('GitIndex.from(buffer)', async () => {
    const { fs, dir } = await makeFixture('test-GitIndex')
    const buffer = await fs.read(path.join(dir, 'index'))
    const index = await GitIndex.from(buffer)
    const rendering = index.render()
    expect(rendering).toMatchInlineSnapshot(`
      "100644 1db939d41956405f755e69ab570296c7ed3cec99    .babelrc
      100644 bbf3e21f43fa4fe25eb925bfcb7c0434f7c2dc7d    .editorconfig
      100644 4a58bdcdef3eb91264dfca0279959d98c16568d5    .flowconfig
      100644 48447164fc125691a3e77899190fcb8ab296b20a    .gitignore
      100644 47967151a5ff9366ca5d86e261c9ceb835d7b722    .travis.yml
      100644 c675a17ccb1578bca836decf90205fdad743827d    LICENSE.md
      100644 f5825f0700bc629db62fc2a2a3cc401095c38011    README.md
      100644 2856b7159ac064d8855da2089f342a785db99aec    package-lock.json
      100644 9784b15bb0d4610b633e1ebb7a6529e900ed1da0    package.json
      100644 6e9d67f2a308ca3d580b78c9f5894dde12fe981d    shrinkwrap.yaml
      100644 3a75c9b6600114dd88ff47bfd4c5e1f8f76be6db    src/commands/checkout.js
      100644 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    src/commands/config.js
      100644 5121e993645da48c428acfdd1970fbfe8bb9a6cc    src/commands/fetch.js
      100644 b439f8a7e95cd1c180238b1f2d1593ee329448ee    src/commands/init.js
      100644 ba6641a796752918bdfa2d3d1da8ccb5ec424b6c    src/index.js
      100644 cd2d01a0fe75d9e736ca623d124082225c97ec62    src/models/GitBlob.js
      100644 f598792ec4380d544ee0f7504e1a30d0ed0abebc    src/models/GitCommit.js
      100644 8657d296d07b4d76302519ac608752397c38cd39    src/models/GitConfig.js
      100644 1104999fec32f7a906cc64cb85c4de23daef7746    src/models/GitObject.js
      100644 467b38e29857cfc863a7be480ca739ef1edd553b    src/models/GitTree.js
      100644 4187b0591eb99fe023a5ead08af217901b938d72    src/utils/exists.js
      100644 1dbbf594d09fbc0fe257a0ed2fecca95b65bebe9    src/utils/mkdirs.js
      100644 b3f16d527a5d80b8893da03e1bf397689ebc06c3    src/utils/read.js
      100644 333191f116d625ba492527ce790fcabe12af33e5    src/utils/resolveRef.js
      100644 38f2a3e9a690581e249b789f2fbed5975d0b11e8    src/utils/write.js
      100644 72ed82e1d1ddb86e6577c80b8a4dfeb4f99c1975    test/_helpers.js
      100644 af8ac5cdb1dfe9415d75e08238c7f820d417fdee    test/snapshots/test-resolveRef.js.md
      100644 d0c8afd043a8887396f949240564fb3bc2a23798    test/snapshots/test-resolveRef.js.snap
      100644 7cc6aba8971d86ec3d306e80e3848b4fd8414ee3    test/test-clone.js
      100644 93f0002a2c0d2156aa15df908a984b2b2144b877    test/test-config.js
      100644 5345ffa5937c2591f96f4213934709b229a48b02    test/test-init.js
      100644 80708a513b7808becff0acfd70dbd3b66a4fb537    test/test-resolveRef.js"
    `)
    const buffer2 = await index.toObject()
    expect(buffer.slice(0, buffer2.length - 20)).toEqual(buffer2.slice(0, -20))
  })

  it('GitIndex round trip', async () => {
    const { fs, dir } = await makeFixture('test-GitIndex')
    const buffer = await fs.read(path.join(dir, 'index'))
    const index = await GitIndex.from(buffer)
    const buffer2 = await index.toObject()
    const index2 = await GitIndex.from(buffer2)
    const buffer3 = await index2.toObject()
    expect(buffer2.buffer).toEqual(buffer3.buffer)
  })

  it('write unmerged index to disk and read it back', async () => {
    const { gitdir, fs } = await makeFixture('test-GitIndex')
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async function(
      index
    ) {
      expect(index.entries.length).toBe(0)
      expect(index.entriesFlat.length).toBe(0)
      index.insert({ filepath: 'a', oid: '01', stage: 1 })
      index.insert({ filepath: 'a', oid: '10', stage: 2 })
      index.insert({ filepath: 'a', oid: '11', stage: 3 })
      expect(index.unmergedPaths).toContain('a')
    })
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async function(
      index
    ) {
      expect(index.entries.length).toBe(1)
      expect(index.entriesFlat.length).toBe(3)
      expect(index.unmergedPaths).toContain('a')

      const entryA = index.entriesMap.get('a')

      expect(entryA.stages.length).toBe(4)
      expect(entryA.stages[1]).toBe(index.entriesFlat[0])
      expect(entryA.stages[2]).toBe(index.entriesFlat[1])
      expect(entryA.stages[3]).toBe(index.entriesFlat[2])
    })
  })

  it('read existing unmerged index', async () => {
    // Setup
    const { gitdir, fs } = await makeFixture('test-GitIndex-unmerged')

    // Test
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async function(
      index
    ) {
      expect(index.unmergedPaths.length).toEqual(2)
      expect(index.entriesFlat.length).toBe(7)
      expect(index.unmergedPaths).toContain('a')
      expect(index.unmergedPaths).toContain('b')
      expect(index.entriesMap.get('a').stages.length).toBe(4)
      expect(index.entriesMap.get('b').stages.length).toBe(4)
      expect(index.entriesMap.get('c').stages.length).toBe(1)
    })
  })
})
