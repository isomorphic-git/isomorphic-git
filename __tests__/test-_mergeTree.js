/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { log, resolveRef } = require('isomorphic-git')
const { _mergeTree } = require('isomorphic-git/internal-apis')

describe('_mergeTree', () => {
  it("merge 'add-files' and 'remove-files'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    const commit = (await log({
      fs,
      gitdir,
      depth: 1,
      ref: 'add-files-merge-remove-files'
    }))[0]
    // Test
    const ourName = 'add-files'
    const theirName = 'remove-files'
    const baseRef = 'mainline'
    const ourOid = await resolveRef({ fs, gitdir, ref: ourName })
    const theirOid = await resolveRef({ fs, gitdir, ref: theirName })
    const baseOid = await resolveRef({ fs, gitdir, ref: baseRef })
    const oid = await _mergeTree({ fs, gitdir, ourOid, theirOid, baseOid, ourName, theirName })
    expect(oid).toBe(commit.tree)
  })

  it("merge 'remove-files' and 'add-files'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    const commit = (await log({
      fs,
      gitdir,
      depth: 1,
      ref: 'remove-files-merge-add-files'
    }))[0]
    // Test
    const ourName = 'remove-files'
    const theirName = 'add-files'
    const baseRef = 'mainline'
    const ourOid = await resolveRef({ fs, gitdir, ref: ourName })
    const theirOid = await resolveRef({ fs, gitdir, ref: theirName })
    const baseOid = await resolveRef({ fs, gitdir, ref: baseRef })
    const oid = await _mergeTree({ fs, gitdir, ourOid, theirOid, baseOid, ourName, theirName })
    expect(oid).toBe(commit.tree)
  })

  it("merge 'delete-first-half' and 'delete-second-half'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    const commit = (await log({
      fs,
      gitdir,
      depth: 1,
      ref: 'delete-first-half-merge-delete-second-half'
    }))[0]
    // Test
    const ourName = 'delete-first-half'
    const theirName = 'delete-second-half'
    const baseRef = 'mainline'
    const ourOid = await resolveRef({ fs, gitdir, ref: ourName })
    const theirOid = await resolveRef({ fs, gitdir, ref: theirName })
    const baseOid = await resolveRef({ fs, gitdir, ref: baseRef })
    const oid = await _mergeTree({ fs, gitdir, ourOid, theirOid, baseOid, ourName, theirName })
    expect(oid).toBe(commit.tree)
  })
})
