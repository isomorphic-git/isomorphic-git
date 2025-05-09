/* eslint-env node, browser, jasmine */
const diff3Merge = require('diff3')
const {
  Errors,
  merge,
  add,
  resolveRef,
  log,
  statusMatrix,
} = require('isomorphic-git')
const gitCommit = require('isomorphic-git').commit

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('merge', () => {
  ;(process.browser ? xit : it)(
    'prevent merge if index has unmerged paths',
    async () => {
      // Setup
      const { gitdir, dir, fs } = await makeFixtureAsSubmodule(
        'test-GitIndex-unmerged'
      )

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
    }
  )
  ;(process.browser ? xit : it)('merge master into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
  ;(process.browser ? xit : it)('merge medium into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
  ;(process.browser ? xit : it)('merge oldest into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
  ;(process.browser ? xit : it)('merge newest into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
  ;(process.browser ? xit : it)('merge no fast-forward', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge-no-ff')
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
  ;(process.browser ? xit : it)(
    'merge newest into master --dryRun (no author needed since fastForward)',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    'merge newest into master --noUpdateBranch',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge 'add-files' and 'remove-files'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge 'remove-files' and 'add-files'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge 'delete-first-half' and 'delete-second-half' (dryRun, missing author)",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge 'delete-first-half' and 'delete-second-half' (dryRun)",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge 'delete-first-half' and 'delete-second-half' (noUpdateBranch)",
    async () => {
      // Setup
      const { fs, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
        'test-merge'
      )
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
          `${gitdirsmfullpath}/objects/${report.oid.slice(
            0,
            2
          )}/${report.oid.slice(2)}`
        )
      ).toBe(true)
    }
  )
  ;(process.browser ? xit : it)(
    "merge 'delete-first-half' and 'delete-second-half'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)("merge 'a-file' and 'a-folder'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
  ;(process.browser ? xit : it)(
    "merge 'g' and 'g-delete-file' (delete by theirs)",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge 'g-delete-file' and 'g' (delete by us)",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge 'i' and 'i-delete-both' (delete by both)",
    async () => {
      // Setup
      const { fs, gitdir, dir } = await makeFixtureAsSubmodule('test-merge')
      const deletedFile = `${dir}/o.txt`
      // Test
      const mergeResult = await merge({
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
      expect(mergeResult).toBeTruthy()
      expect(await fs.exists(deletedFile)).toBeFalsy()
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches that modified the same file (no conflict)'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches where one modified file and the other modified file mode'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches that modified the same file, no conflict resolver (should conflict)'",
    async () => {
      // Setup
      const {
        fs,
        gitdir,
        dir,
        gitdirsmfullpath,
      } = await makeFixtureAsSubmodule('test-merge')
      // Test
      const testFile = `${gitdirsmfullpath}/o.conflict.example`
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
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches that modified the same file, no conflict resolver, don't update worktree'",
    async () => {
      // Setup
      const { fs, gitdir, dir } = await makeFixtureAsSubmodule('test-merge')
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
      let testfiles = await fs.readdir(dir)
      testfiles = testfiles.filter(e => e !== '.git')
      expect(testfiles).toEqual([])
      expect(error).not.toBeNull()
      expect(error.code).toBe(Errors.MergeConflictError.code)
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches that modified the same file, custom conflict resolver (prefer our changes)'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')

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
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches that modified the same file, custom conflict resolver (prefer their changes)'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')

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
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches that modified the same file, custom conflict resolver (prefer our file)'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')

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
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches that modified the same file, custom conflict resolver (prefer their file)'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')

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
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches that modified the same file, custom conflict resolver (prefer base file)'",
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')

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
    }
  )
  ;(process.browser ? xit : it)(
    "merge two branches that modified the same file, manual conflict resolution'",
    async () => {
      // Setup
      const { fs, gitdir, dir } = await makeFixtureAsSubmodule('test-merge')

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
    }
  )
  ;(process.browser ? xit : it)(
    'merge two branches where ours adds a new file and theirs deletes a file',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule(
        'test-merge-file-deletion'
      )

      const commit = (
        await log({
          fs,
          gitdir,
          depth: 1,
          ref: 'a-merge-b-reference',
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
    }
  )
  ;(process.browser ? xit : it)(
    'merge two branches where ours deletes a file and theirs adds a new file',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule(
        'test-merge-file-deletion'
      )

      const commit = (
        await log({
          fs,
          gitdir,
          depth: 1,
          ref: 'c-merge-d-reference',
        })
      )[0].commit
      // Test
      const report = await merge({
        fs,
        gitdir,
        ours: 'c',
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
          ref: 'c',
          depth: 1,
        })
      )[0].commit

      expect(report.tree).toBe(commit.tree)
      expect(mergeCommit.tree).toEqual(commit.tree)
      expect(mergeCommit.message).toEqual(commit.message)
      expect(mergeCommit.parent).toEqual(commit.parent)
    }
  )
  ;(process.browser ? xit : it)(
    'merge preserves nested directory structure when combining unrelated changes',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule(
        'test-merge-file-deletion'
      )

      const commit = (
        await log({
          fs,
          gitdir,
          depth: 1,
          ref: 'e-merge-f-reference',
        })
      )[0].commit
      // Test
      const report = await merge({
        fs,
        gitdir,
        ours: 'e',
        theirs: 'f',
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
          ref: 'e',
          depth: 1,
        })
      )[0].commit

      expect(report.tree).toBe(commit.tree)
      expect(mergeCommit.tree).toEqual(commit.tree)
      expect(mergeCommit.message).toEqual(commit.message)
      expect(mergeCommit.parent).toEqual(commit.parent)
    }
  )
  ;(process.browser ? xit : it)(
    'merge two branches where both ours and theirs delete the same file',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule(
        'test-merge-file-deletion'
      )

      const commit = (
        await log({
          fs,
          gitdir,
          depth: 1,
          ref: 'g-merge-h-reference',
        })
      )[0].commit
      // Test
      const report = await merge({
        fs,
        gitdir,
        ours: 'g',
        theirs: 'h',
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
          ref: 'g',
          depth: 1,
        })
      )[0].commit

      expect(report.tree).toBe(commit.tree)
      expect(mergeCommit.tree).toEqual(commit.tree)
      expect(mergeCommit.message).toEqual(commit.message)
      expect(mergeCommit.parent).toEqual(commit.parent)
    }
  )
  ;(process.browser ? xit : it)(
    'merge two branches with unrelated histories where they add 2 files having different name',
    async () => {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-empty')

      const author = {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      }

      // First root commit on 'master'
      await fs.write(`${dir}/a.txt`, 'hello a')
      await add({ fs, dir, gitdir, filepath: 'a.txt' })
      await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'master',
        message: 'Add a.txt',
        author,
      })

      // Second root commit on unrelated branch 'other'
      await fs.write(`${dir}/b.txt`, 'hello b')
      await add({ fs, dir, gitdir, filepath: 'b.txt' })
      await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'other',
        message: 'Add b.txt',
        author,
      })

      const report = await merge({
        fs,
        gitdir,
        ours: 'master',
        theirs: 'other',
        abortOnConflict: false,
        allowUnrelatedHistories: true,
        author,
      })

      expect(report).toBeTruthy()
      expect(report.mergeCommit).toBeTruthy()
      const mergeHead = (await log({ fs, gitdir, ref: 'master', depth: 1 }))[0]
        .commit
      expect(mergeHead.parent.length).toBe(2)

      const matrix = await statusMatrix({ fs, dir, gitdir })
      const trackedFiles = matrix.map(row => row[0])
      expect(trackedFiles.join()).toEqual(['a.txt', 'b.txt'].join())

      const history = await log({ fs, gitdir, ref: 'master', depth: 3 })
      const messages = history.map(entry =>
        entry.commit.message.replace('\n', '')
      )
      expect(messages.join()).toEqual(
        [`Merge branch 'other' into master`, 'Add b.txt', 'Add a.txt'].join()
      )
    }
  )
  ;(process.browser ? xit : it)(
    'merge two branches with unrelated histories where they add 2 files having same name',
    async () => {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-empty')
      const author = {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      }

      // First root commit on master adding same.txt
      await fs.write(`${dir}/same.txt`, 'content from master')
      await add({ fs, dir, gitdir, filepath: 'same.txt' })
      await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'master',
        message: 'Add same.txt on master',
        author,
      })

      // Second unrelated root commit on branch 'other' adding same.txt with different content
      await fs.write(`${dir}/same.txt`, 'content from other')
      await add({ fs, dir, gitdir, filepath: 'same.txt' })
      await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'other',
        parent: [],
        message: 'Add same.txt on other',
        author,
      })

      let error = null
      try {
        await merge({
          fs,
          dir,
          gitdir,
          ours: 'master',
          theirs: 'other',
          abortOnConflict: false,
          allowUnrelatedHistories: true,
          author,
        })
      } catch (e) {
        error = e
      }
      expect(error).not.toBeNull()
      expect(error.code).toBe(Errors.MergeConflictError.code)
      const resultText = await fs.read(`${dir}/same.txt`, 'utf8')
      expect(resultText).toContain('<<<<<<<')

      const matrix = await statusMatrix({ fs, dir, gitdir })
      const trackedFiles = matrix.map(row => row[0])
      expect(trackedFiles.join()).toEqual(['same.txt'].join())

      const history = await log({ fs, gitdir, ref: 'master', depth: 3 })
      const messages = history.map(entry =>
        entry.commit.message.replace('\n', '')
      )
      expect(messages.join()).toEqual(['Add same.txt on master'].join())
    }
  )
  ;(process.browser ? xit : it)(
    'merge two branches with unrelated histories where they add files in nested directories',
    async () => {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-empty')

      const author = {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      }

      // First root commit on 'master' with nested directory
      await fs.mkdir(`${dir}/dir1`)
      await fs.mkdir(`${dir}/dir1/subdir1`)
      await fs.write(`${dir}/dir1/subdir1/file1.txt`, 'content from master')
      await add({ fs, dir, gitdir, filepath: 'dir1/subdir1/file1.txt' })
      await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'master',
        message: 'Add file in nested directory on master',
        author,
      })

      // Second root commit on unrelated branch 'other' with different nested directory
      await fs.mkdir(`${dir}/dir2`)
      await fs.mkdir(`${dir}/dir2/subdir2`)
      await fs.write(`${dir}/dir2/subdir2/file2.txt`, 'content from other')
      await add({ fs, dir, gitdir, filepath: 'dir2/subdir2/file2.txt' })
      await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'other',
        message: 'Add file in different nested directory on other',
        author,
      })

      const report = await merge({
        fs,
        gitdir,
        ours: 'master',
        theirs: 'other',
        abortOnConflict: false,
        allowUnrelatedHistories: true,
        author,
      })

      expect(report).toBeTruthy()
      expect(report.mergeCommit).toBeTruthy()
      const mergeHead = (await log({ fs, gitdir, ref: 'master', depth: 1 }))[0]
        .commit
      expect(mergeHead.parent.length).toBe(2)

      const matrix = await statusMatrix({ fs, dir, gitdir })
      const trackedFiles = matrix.map(row => row[0])
      expect(trackedFiles.join()).toEqual(
        ['dir1/subdir1/file1.txt', 'dir2/subdir2/file2.txt'].join()
      )

      const history = await log({ fs, gitdir, ref: 'master', depth: 3 })
      const messages = history.map(entry =>
        entry.commit.message.replace('\n', '')
      )
      expect(messages.join()).toEqual(
        [
          `Merge branch 'other' into master`,
          'Add file in different nested directory on other',
          'Add file in nested directory on master',
        ].join()
      )
    }
  )
  ;(process.browser ? xit : it)(
    'merge two branches with unrelated histories where they add files with same path in nested directories',
    async () => {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-empty')
      const author = {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      }

      // First root commit on master adding nested file
      await fs.mkdir(`${dir}/shared`)
      await fs.mkdir(`${dir}/shared/path`)
      await fs.write(`${dir}/shared/path/conflict.txt`, 'content from master')
      await add({ fs, dir, gitdir, filepath: 'shared/path/conflict.txt' })
      await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'master',
        message: 'Add nested file on master',
        author,
      })

      // Second unrelated root commit on branch 'other' adding same nested file with different content
      await fs.mkdir(`${dir}/shared`)
      await fs.mkdir(`${dir}/shared/path`)
      await fs.write(`${dir}/shared/path/conflict.txt`, 'content from other')
      await add({ fs, dir, gitdir, filepath: 'shared/path/conflict.txt' })
      await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'other',
        parent: [],
        message: 'Add nested file on other',
        author,
      })

      let error = null
      try {
        await merge({
          fs,
          dir,
          gitdir,
          ours: 'master',
          theirs: 'other',
          abortOnConflict: false,
          allowUnrelatedHistories: true,
          author,
        })
      } catch (e) {
        error = e
      }
      expect(error).not.toBeNull()
      expect(error.code).toBe(Errors.MergeConflictError.code)
      const resultText = await fs.read(
        `${dir}/shared/path/conflict.txt`,
        'utf8'
      )
      expect(resultText).toContain('<<<<<<<')

      const matrix = await statusMatrix({ fs, dir, gitdir })
      const trackedFiles = matrix.map(row => row[0])
      expect(trackedFiles.join()).toEqual(['shared/path/conflict.txt'].join())

      const history = await log({ fs, gitdir, ref: 'master', depth: 3 })
      const messages = history.map(entry =>
        entry.commit.message.replace('\n', '')
      )
      expect(messages.join()).toEqual(['Add nested file on master'].join())
    }
  )
})
