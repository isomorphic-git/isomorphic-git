/* eslint-env node, browser, jasmine */
const diff3Merge = require('diff3')
const { Errors, merge, add, resolveRef, log } = require('isomorphic-git')
const gitCommit = require('isomorphic-git').commit

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('merge', () => {
  it('prevent merge if index has unmerged paths', async () => {
    // Setup
    const { gitdir, dir, fs } = await makeFixture('test-GitIndex-unmerged')

    // Test
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'b',
        abortOnConflict: false,
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
    expect(error.code).toBe(Errors.UnmergedPathsError.code)
  })
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

  it('merge no fast-forward', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge-no-ff')
    // Test
    const m = await merge({
      fs,
      gitdir,
      ours: 'main',
      theirs: 'add-files',
      fastForward: false,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    expect(m.oid).toBeTruthy()
    expect(m.tree).toBeTruthy()
    expect(m.alreadyMerged).toBeFalsy()
    expect(m.fastForward).toBeFalsy()
    expect(m.mergeCommit).toBeTruthy()
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

  it("merge 'g' and 'g-delete-file' (delete by theirs)", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    let error = null
    try {
      await merge({
        fs,
        gitdir,
        ours: 'g',
        theirs: 'g-delete-file',
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
    expect(error.code).toBe(Errors.MergeConflictError.code)
  })

  it("merge 'g-delete-file' and 'g' (delete by us)", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')
    // Test
    let error = null
    try {
      await merge({
        fs,
        gitdir,
        ours: 'g-delete-file',
        theirs: 'g',
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
    expect(error.code).toBe(Errors.MergeConflictError.code)
  })

  it("merge 'i' and 'i-delete-both' (delete by both)", async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-merge')
    const deletedFile = `${dir}/o.txt`
    // Test
    const mergeReuslt = await merge({
      fs,
      gitdir,
      ours: 'i',
      theirs: 'i-delete-both',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    expect(mergeReuslt).toBeTruthy()
    expect(await fs.exists(deletedFile)).toBeFalsy()
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

  it("merge two branches that modified the same file, no conflict resolver (should conflict)'", async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-merge')
    // Test
    const testFile = `${gitdir}/o.conflict.example`
    const outFile = `${dir}/o.txt`
    const cache = {}

    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'c',
        abortOnConflict: false,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
        cache,
      })
    } catch (e) {
      error = e
    }

    expect(await fs.read(outFile, 'utf-8')).toBe(
      await fs.read(testFile, 'utf-8')
    )
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)
  })

  it("merge two branches that modified the same file, no conflict resolver, don't update worktree'", async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-merge')
    // Test
    const outFile = `${dir}/o.txt`

    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours: 'a',
        theirs: 'c',
        abortOnConflict: true,
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
    expect(await fs.read(outFile, 'utf-8')).toBeNull()
    expect(await fs.readdir(dir)).toEqual([])
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)
  })

  it("merge two branches that modified the same file, custom conflict resolver (prefer our changes)'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')

    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'a-merge-c-recursive-ours',
      })
    )[0].commit
    // Test
    const report = await merge({
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
      mergeDriver: ({ branches, contents }) => {
        const baseContent = contents[0]
        const ourContent = contents[1]
        const theirContent = contents[2]

        const LINEBREAKS = /^.*(\r?\n|$)/gm
        const ours = ourContent.match(LINEBREAKS)
        const base = baseContent.match(LINEBREAKS)
        const theirs = theirContent.match(LINEBREAKS)
        const result = diff3Merge(ours, base, theirs)
        let mergedText = ''
        for (const item of result) {
          if (item.ok) {
            mergedText += item.ok.join('')
          }
          if (item.conflict) {
            mergedText += item.conflict.a.join('')
          }
        }
        return { cleanMerge: true, mergedText }
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
  it("merge two branches that modified the same file, custom conflict resolver (prefer their changes)'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')

    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'a-merge-c-recursive-theirs',
      })
    )[0].commit
    // Test
    const report = await merge({
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
      mergeDriver: ({ branches, contents }) => {
        const baseContent = contents[0]
        const ourContent = contents[1]
        const theirContent = contents[2]

        const LINEBREAKS = /^.*(\r?\n|$)/gm
        const ours = ourContent.match(LINEBREAKS)
        const base = baseContent.match(LINEBREAKS)
        const theirs = theirContent.match(LINEBREAKS)
        const result = diff3Merge(ours, base, theirs)
        let mergedText = ''
        for (const item of result) {
          if (item.ok) {
            mergedText += item.ok.join('')
          }
          if (item.conflict) {
            mergedText += item.conflict.b.join('')
          }
        }
        return { cleanMerge: true, mergedText }
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
  it("merge two branches that modified the same file, custom conflict resolver (prefer our file)'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')

    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'a-merge-c-use-ours',
      })
    )[0].commit
    // Test
    const report = await merge({
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
      mergeDriver: ({ branches, contents }) => {
        const mergedText = contents[1]
        return { cleanMerge: true, mergedText }
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
  it("merge two branches that modified the same file, custom conflict resolver (prefer their file)'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')

    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'a-merge-c-use-theirs',
      })
    )[0].commit
    // Test
    const report = await merge({
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
      mergeDriver: ({ branches, contents }) => {
        const mergedText = contents[2]
        return { cleanMerge: true, mergedText }
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
  it("merge two branches that modified the same file, custom conflict resolver (prefer base file)'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-merge')

    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'a-merge-c-use-base',
      })
    )[0].commit
    // Test
    const report = await merge({
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
      mergeDriver: ({ branches, contents }) => {
        const baseContent = contents[0]
        const ourContent = contents[1]
        const theirContent = contents[2]
        const mergedText = baseContent || ourContent || theirContent
        return { cleanMerge: true, mergedText }
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
  it("merge two branches that modified the same file, manual conflict resolution'", async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-merge')

    const commit = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'a-merge-c-manual-resolve',
      })
    )[0].commit
    // Test
    await merge({
      fs,
      dir,
      gitdir,
      ours: 'a',
      theirs: 'c',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      abortOnConflict: false,
    }).catch(e => {
      if (!(e instanceof Errors.MergeConflictError)) throw e
    })
    await add({
      fs,
      dir,
      gitdir,
      filepath: '.',
    })
    await gitCommit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      ref: 'a',
      message: "Merge branch 'c' into a",
      parent: ['a', 'c'],
    })
    const mergeCommit = (
      await log({
        fs,
        gitdir,
        ref: 'a',
        depth: 1,
      })
    )[0].commit

    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })
})
