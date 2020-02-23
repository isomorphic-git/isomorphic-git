/* eslint-env node, browser, jasmine */
const { Errors, merge, resolveRef, log } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('merge', () => {
  it('merge master into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    const m = await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'master',
      fastForwardOnly: true,
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    const oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge medium into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'medium',
    })
    const m = await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'medium',
      fastForwardOnly: true,
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    const oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge oldest into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    const m = await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'oldest',
      fastForwardOnly: true,
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeTruthy()
    expect(m.fastForward).toBeFalsy()
    const oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge newest into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    const desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'newest',
    })
    const m = await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true,
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeTruthy()
    const oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge newest into master --dryRun (no author needed since fastForward)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    const originalOid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    const desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'newest',
    })
    const m = await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true,
      dryRun: true,
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeTruthy()
    const oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    expect(oid).toEqual(originalOid)
  })

  it('merge newest into master --noUpdateBranch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    const originalOid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    const desiredOid = await resolveRef({
      fs,
      gitdir,
      ref: 'newest',
    })
    const m = await merge({
      fs,
      gitdir,
      ours: 'master',
      theirs: 'newest',
      fastForwardOnly: true,
      dryRun: true,
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeTruthy()
    const oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    expect(oid).toEqual(originalOid)
  })

  it("merge 'add-files' and 'remove-files'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'add-files-merge-remove-files',
      })
    )[0].commit
    // Test
    const report = await merge({
      fs,
      gitdir,
      ours: 'add-files',
      theirs: 'remove-files',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    const mergeCommit = (
      await log({
        fs,
        gitdir,
        ref: 'add-files',
        depth: 1,
      })
    )[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge 'remove-files' and 'add-files'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'remove-files-merge-add-files',
      })
    )[0].commit
    // TestTest
    const report = await merge({
      fs,
      gitdir,
      ours: 'remove-files',
      theirs: 'add-files',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    const mergeCommit = (
      await log({
        fs,
        gitdir,
        ref: 'remove-files',
        depth: 1,
      })
    )[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge 'delete-first-half' and 'delete-second-half' (dryRun, missing author)", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    let error = null
    try {
      await merge({
        fs,
        gitdir,
        ours: 'delete-first-half',
        theirs: 'delete-second-half',
        dryRun: true,
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBe(null)
    expect(error.code).toBe(Errors.MissingNameError.code)
  })

  it("merge 'delete-first-half' and 'delete-second-half' (dryRun)", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'delete-first-half-merge-delete-second-half',
      })
    )[0]
    const originalCommit = (
      await log({
        fs,
        gitdir,
        ref: 'delete-first-half',
        depth: 1,
      })
    )[0]
    // Test
    const report = await merge({
      fs,
      gitdir,
      ours: 'delete-first-half',
      theirs: 'delete-second-half',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      dryRun: true,
    })
    expect(report.tree).toBe(commit.commit.tree)
    // make sure branch hasn't been moved
    const notMergeCommit = (
      await log({
        fs,
        gitdir,
        ref: 'delete-first-half',
        depth: 1,
      })
    )[0]
    expect(notMergeCommit.oid).toEqual(originalCommit.oid)
    if (!report.oid) throw new Error('type error')
    // make sure no commit object was created
    expect(
      await fs.exists(
        `${gitdir}/objects/${report.oid.slice(0, 2)}/${report.oid.slice(2)}`
      )
    ).toBe(false)
  })

  it("merge 'delete-first-half' and 'delete-second-half' (noUpdateBranch)", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'delete-first-half-merge-delete-second-half',
      })
    )[0]
    const originalCommit = (
      await log({
        fs,
        gitdir,
        ref: 'delete-first-half',
        depth: 1,
      })
    )[0]
    // Test
    const report = await merge({
      fs,
      gitdir,
      ours: 'delete-first-half',
      theirs: 'delete-second-half',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      noUpdateBranch: true,
    })
    expect(report.tree).toBe(commit.commit.tree)
    // make sure branch hasn't been moved
    const notMergeCommit = (
      await log({
        fs,
        gitdir,
        ref: 'delete-first-half',
        depth: 1,
      })
    )[0]
    expect(notMergeCommit.oid).toEqual(originalCommit.oid)
    if (!report.oid) throw new Error('type error')
    // but make sure the commit object exists
    expect(
      await fs.exists(
        `${gitdir}/objects/${report.oid.slice(0, 2)}/${report.oid.slice(2)}`
      )
    ).toBe(true)
  })

  it("merge 'delete-first-half' and 'delete-second-half'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'delete-first-half-merge-delete-second-half',
      })
    )[0].commit
    // Test
    const report = await merge({
      fs,
      gitdir,
      ours: 'delete-first-half',
      theirs: 'delete-second-half',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    const mergeCommit = (
      await log({
        fs,
        gitdir,
        ref: 'delete-first-half',
        depth: 1,
      })
    )[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge 'a-file' and 'a-folder'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    let error = null
    try {
      await merge({
        fs,
        gitdir,
        ours: 'a-file',
        theirs: 'a-folder',
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeNotSupportedError.code)
  })

  it("merge two branches that modified the same file (no conflict)'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'a-merge-b',
      })
    )[0].commit
    // Test
    const report = await merge({
      fs,
      gitdir,
      ours: 'a',
      theirs: 'b',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    const mergeCommit = (
      await log({
        fs,
        gitdir,
        ref: 'a',
        depth: 1,
      })
    )[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge two branches where one modified file and the other modified file mode'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'a-merge-d',
      })
    )[0].commit
    // Test
    const report = await merge({
      fs,
      gitdir,
      ours: 'a',
      theirs: 'd',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    const mergeCommit = (
      await log({
        fs,
        gitdir,
        ref: 'a',
        depth: 1,
      })
    )[0].commit
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })

  it("merge two branches that modified the same file (should conflict)'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    let error = null
    try {
      await merge({
        fs,
        gitdir,
        ours: 'a',
        theirs: 'c',
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeNotSupportedError.code)
  })
})
