/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { E, merge, resolveRef, log } = require('isomorphic-git')

describe('merge', () => {
  it('merge master into master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'master',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge medium into master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'medium'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'medium',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge oldest into master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'oldest',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge newest into master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'newest'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeTruthy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge newest into master --dryRun (no author needed since fastForward)', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const originalOid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'newest'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true,
      dryRun: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeTruthy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(originalOid)
  })

  it('merge newest into master --noUpdateBranch', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    const originalOid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    const desiredOid = await resolveRef({
      gitdir,
      ref: 'newest'
    })
    const m = await merge({
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true,
      dryRun: true
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeTruthy()
    const oid = await resolveRef({
      gitdir,
      ref: 'master'
    })
    expect(oid).toEqual(originalOid)
  })

  it("merge 'add-files' and 'remove-files'", async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'add-files-merge-remove-files'
    }))[0].commit
    // Test
    const report = await merge({
      gitdir,
      ours: 'add-files',
      theirs: 'remove-files',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      }
    })
    const mergeCommit = (await log({ gitdir, ref: 'add-files', depth: 1 }))[0]
      .commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge 'remove-files' and 'add-files'", async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'remove-files-merge-add-files'
    }))[0].commit
    // TestTest
    const report = await merge({
      gitdir,
      ours: 'remove-files',
      theirs: 'add-files',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      }
    })
    const mergeCommit = (await log({
      gitdir,
      ref: 'remove-files',
      depth: 1
    }))[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge 'delete-first-half' and 'delete-second-half' (dryRun, missing author)", async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    let error = null
    try {
      await merge({
        gitdir,
        ours: 'delete-first-half',
        theirs: 'delete-second-half',
        dryRun: true
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBe(null)
    expect(error.code).toBe(E.MissingAuthorError)
  })

  it("merge 'delete-first-half' and 'delete-second-half' (dryRun)", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'delete-first-half-merge-delete-second-half'
    }))[0]
    const originalCommit = (await log({
      gitdir,
      ref: 'delete-first-half',
      depth: 1
    }))[0]
    // Test
    const report = await merge({
      gitdir,
      ours: 'delete-first-half',
      theirs: 'delete-second-half',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      dryRun: true
    })
    expect(report.tree).toBe(commit.commit.tree)
    // make sure branch hasn't been moved
    const notMergeCommit = (await log({
      gitdir,
      ref: 'delete-first-half',
      depth: 1
    }))[0]
    expect(notMergeCommit.oid).toEqual(originalCommit.oid)
    // make sure no commit object was created
    expect(
      await fs.exists(
        // @ts-ignore
        `${gitdir}/objects/${report.oid.slice(0, 2)}/${report.oid.slice(2)}`
      )
    ).toBe(false)
  })

  it("merge 'delete-first-half' and 'delete-second-half' (noUpdateBranch)", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'delete-first-half-merge-delete-second-half'
    }))[0]
    const originalCommit = (await log({
      gitdir,
      ref: 'delete-first-half',
      depth: 1
    }))[0]
    // Test
    const report = await merge({
      gitdir,
      ours: 'delete-first-half',
      theirs: 'delete-second-half',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      noUpdateBranch: true
    })
    expect(report.tree).toBe(commit.commit.tree)
    // make sure branch hasn't been moved
    const notMergeCommit = (await log({
      gitdir,
      ref: 'delete-first-half',
      depth: 1
    }))[0]
    expect(notMergeCommit.oid).toEqual(originalCommit.oid)
    // but make sure the commit object exists
    expect(
      await fs.exists(
        // @ts-ignore
        `${gitdir}/objects/${report.oid.slice(0, 2)}/${report.oid.slice(2)}`
      )
    ).toBe(true)
  })

  it("merge 'delete-first-half' and 'delete-second-half'", async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'delete-first-half-merge-delete-second-half'
    }))[0].commit
    // Test
    const report = await merge({
      gitdir,
      ours: 'delete-first-half',
      theirs: 'delete-second-half',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      }
    })
    const mergeCommit = (await log({
      gitdir,
      ref: 'delete-first-half',
      depth: 1
    }))[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge 'a-file' and 'a-folder'", async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    let error = null
    try {
      await merge({
        gitdir,
        ours: 'a-file',
        theirs: 'a-folder',
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0
        }
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(E.MergeNotSupportedFail)
  })

  it("merge two branches that modified the same file (no conflict)'", async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'a-merge-b'
    }))[0].commit
    // Test
    const report = await merge({
      gitdir,
      ours: 'a',
      theirs: 'b',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      }
    })
    const mergeCommit = (await log({
      gitdir,
      ref: 'a',
      depth: 1
    }))[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge two branches where one modified file and the other modified file mode'", async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'a-merge-d'
    }))[0].commit
    // Test
    const report = await merge({
      gitdir,
      ours: 'a',
      theirs: 'd',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      }
    })
    const mergeCommit = (await log({
      gitdir,
      ref: 'a',
      depth: 1
    }))[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge two branches that modified the same file (should conflict)'", async () => {
    // Setup
    const { gitdir } = await makeFixture('test-merge')
    // Test
    let error = null
    try {
      await merge({
        gitdir,
        ours: 'a',
        theirs: 'c',
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0
        }
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(E.MergeNotSupportedFail)
  })
})
