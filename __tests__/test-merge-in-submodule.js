/* eslint-env node, browser, jasmine */

import diff3Merge from 'diff3'
import {
  Errors,
  merge,
  add,
  branch,
  checkout,
  init,
  listFiles,
  listUnmergedFiles,
  readObject,
  readBlob,
  readTree,
  remove,
  resolveRef,
  log,
  status,
  statusMatrix,
  commit as gitCommit,
  annotatedTag,
  writeBlob,
  writeTree,
} from 'isomorphic-git'
import { GitIndexManager, discoverGitdir } from 'isomorphic-git/internal-apis'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

describe('merge', () => {
  it('prevent merge if index has unmerged paths', async () => {
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
  })
  it('merge master into master', async () => {
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

  it('merge medium into master', async () => {
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

  it('merge oldest into master', async () => {
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

  it('merge newest into master', async () => {
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

  it('merge annotated tag of newest into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
    await annotatedTag({
      fs,
      gitdir,
      ref: 'newest-tag',
      object: 'newest',
      message: 'annotated tag',
      tagger: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
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
      theirs: 'newest-tag',
      fastForwardOnly: true,
    })
    expect(m.oid).toEqual(desiredOid)
    expect(m.fastForward).toBeTruthy()
    const oid = await resolveRef({
      fs,
      gitdir,
      ref: 'master',
    })
    expect(oid).toEqual(desiredOid)
  })

  it('merge annotated tag oid of newest into master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-merge')
    await annotatedTag({
      fs,
      gitdir,
      ref: 'newest-tag',
      object: 'newest',
      message: 'annotated tag',
      tagger: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    const tagOid = await resolveRef({ fs, gitdir, ref: 'newest-tag' })
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
      theirs: tagOid,
      fastForwardOnly: true,
    })
    expect(m.oid).toEqual(desiredOid)
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

  it('merge newest into master --dryRun (no author needed since fastForward)', async () => {
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
  })

  it('merge newest into master --noUpdateBranch', async () => {
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
  })

  it("merge 'add-files' and 'remove-files'", async () => {
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
  })

  it("merge 'remove-files' and 'add-files'", async () => {
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
  })

  it("merge 'delete-first-half' and 'delete-second-half' (dryRun, missing author)", async () => {
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
  })

  it("merge 'delete-first-half' and 'delete-second-half' (dryRun)", async () => {
    // Setup
    const { fs, gitdir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-merge')
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
        `${gitdirsmfullpath}/objects/${report.oid.slice(
          0,
          2
        )}/${report.oid.slice(2)}`
      )
    ).toBe(false)
  })

  it("merge 'delete-first-half' and 'delete-second-half' (noUpdateBranch)", async () => {
    // Setup
    const { fs, gitdir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-merge')
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
        `${gitdirsmfullpath}/objects/${report.oid.slice(0, 2)}/${report.oid.slice(2)}`
      )
    ).toBe(true)
  })

  it("merge 'delete-first-half' and 'delete-second-half'", async () => {
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
  })

  it("merge 'a-file' and 'a-folder'", async () => {
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

  it("merge 'g' and 'g-delete-file' (delete by theirs)", async () => {
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
  })

  it("merge 'g-delete-file' and 'g' (delete by us)", async () => {
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
  })

  it("merge 'i' and 'i-delete-both' (delete by both)", async () => {
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
  })

  it("merge two branches that modified the same file (no conflict)'", async () => {
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
  })

  it("merge two branches where one modified file and the other modified file mode'", async () => {
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
  })

  it("merge two branches that modified the same file, no conflict resolver (should conflict)'", async () => {
    // Setup
    const { fs, gitdir, dir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-merge')
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
  })

  it("merge two branches that modified the same file, no conflict resolver, don't update worktree'", async () => {
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
  })

  it("merge two branches that modified the same file, custom conflict resolver (prefer our changes)'", async () => {
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
  })
  it("merge two branches that modified the same file, custom conflict resolver (prefer their changes)'", async () => {
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
  })
  it("merge two branches that modified the same file, custom conflict resolver (prefer our file)'", async () => {
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
  })
  it("merge two branches that modified the same file, custom conflict resolver (prefer their file)'", async () => {
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
  })
  it("merge two branches that modified the same file, custom conflict resolver (prefer base file)'", async () => {
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
  })
  it("merge two branches that modified the same file, manual conflict resolution'", async () => {
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
  })
  it('merge two branches where ours adds a new file and theirs deletes a file', async () => {
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
  })
  it('merge two branches where ours deletes a file and theirs adds a new file', async () => {
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
  })
  it('merge preserves nested directory structure when combining unrelated changes', async () => {
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
  })
  it('merge two branches where both ours and theirs delete the same file', async () => {
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
  })
  it('merge two branches with unrelated histories where they add 2 files having different name', async () => {
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
  })

  it('merge two branches with unrelated histories where they add 2 files having same name', async () => {
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
  })

  it('merge two branches with unrelated histories where they add files in nested directories', async () => {
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
  })

  it('merge two branches with unrelated histories where they add files with same path in nested directories', async () => {
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
    const resultText = await fs.read(`${dir}/shared/path/conflict.txt`, 'utf8')
    expect(resultText).toContain('<<<<<<<')

    const matrix = await statusMatrix({ fs, dir, gitdir })
    const trackedFiles = matrix.map(row => row[0])
    expect(trackedFiles.join()).toEqual(['shared/path/conflict.txt'].join())

    const history = await log({ fs, gitdir, ref: 'master', depth: 3 })
    const messages = history.map(entry =>
      entry.commit.message.replace('\n', '')
    )
    expect(messages.join()).toEqual(['Add nested file on master'].join())
  })

  it('merge conflict does not corrupt binary files in the working directory', async () => {
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-empty')
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    // Every possible byte value, so the file is not valid UTF-8 text. It only
    // survives if working directory contents are written verbatim.
    const binary = Uint8Array.from({ length: 256 }, (_, i) => i)

    // Multibyte UTF-8, to catch a text file being re-encoded rather than copied.
    const unicodeText = 'Ünicode: αβγδ 日本語 🎉\n'

    // Base commit: the file that will conflict, plus a text file and a binary
    // file that neither branch touches.
    await fs.write(`${dir}/doc.txt`, 'base content\n')
    await fs.write(`${dir}/notes.md`, unicodeText)
    await fs.write(`${dir}/image.bin`, binary)
    await add({ fs, dir, gitdir, filepath: 'doc.txt' })
    await add({ fs, dir, gitdir, filepath: 'notes.md' })
    await add({ fs, dir, gitdir, filepath: 'image.bin' })
    const base = await gitCommit({
      fs,
      dir,
      gitdir,
      ref: 'master',
      message: 'Add a text file and a binary file',
      author,
    })

    // master edits only the text file.
    await fs.write(`${dir}/doc.txt`, 'master content\n')
    await add({ fs, dir, gitdir, filepath: 'doc.txt' })
    await gitCommit({
      fs,
      dir,
      gitdir,
      ref: 'master',
      message: 'Edit the text file on master',
      author,
    })

    // other edits only the text file, from the same base, so the two conflict.
    await fs.write(`${dir}/doc.txt`, 'other content\n')
    await add({ fs, dir, gitdir, filepath: 'doc.txt' })
    await gitCommit({
      fs,
      dir,
      gitdir,
      ref: 'other',
      parent: [base],
      message: 'Edit the text file on other',
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
        author,
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    // The conflict is in doc.txt. Both image.bin and notes.md are identical on
    // both branches and are not part of the merge, so they must survive
    // untouched even though the conflicted merge rewrites the whole tree.
    const binaryAfterMerge = await fs.read(`${dir}/image.bin`)
    expect(Array.from(binaryAfterMerge)).toEqual(Array.from(binary))

    expect(await fs.read(`${dir}/notes.md`, 'utf8')).toBe(unicodeText)

    // The text conflict still materialises in the working directory.
    expect(await fs.read(`${dir}/doc.txt`, 'utf8')).toContain('<<<<<<<')
  })

  describe('conflicts written to the working tree', () => {
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    // base:    conflict.txt, theirs.txt, ours.txt, both.txt, gone.txt,
    //          same.txt, run.sh (executable), sub/nested.txt
    // feature: edits conflict.txt, theirs.txt, both.txt (end), run.sh and
    //          sub/nested.txt, deletes gone.txt, adds added.txt
    // master:  edits conflict.txt, ours.txt and both.txt (start)
    async function setup(name) {
      const { fs, dir, gitdir, gitdirsmfullpath } =
        await makeFixtureAsSubmodule(name)
      await init({ fs, dir, gitdir })
      await fs.write(`${dir}/conflict.txt`, 'one\ntwo\nthree\n')
      await fs.write(`${dir}/theirs.txt`, 'base\n')
      await fs.write(`${dir}/ours.txt`, 'base\n')
      await fs.write(`${dir}/both.txt`, 'start\nmiddle\nend\n')
      await fs.write(`${dir}/gone.txt`, 'gone\n')
      await fs.write(`${dir}/same.txt`, 'same\n')
      await fs.write(`${dir}/run.sh`, '#!/bin/sh\n', { mode: 0o777 })
      await fs.write(`${dir}/sub/nested.txt`, 'base\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      const baseOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'base',
        author,
      })

      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fs.write(`${dir}/conflict.txt`, 'one\nfeature\nthree\n')
      await fs.write(`${dir}/theirs.txt`, 'feature\n')
      await fs.write(`${dir}/both.txt`, 'start\nmiddle\nfeature end\n')
      await fs.write(`${dir}/run.sh`, '#!/bin/sh\necho feature\n')
      await fs.write(`${dir}/sub/nested.txt`, 'feature\n')
      await fs.write(`${dir}/added.txt`, 'added\n')
      await fs.rm(`${dir}/gone.txt`)
      await add({ fs, dir, gitdir, filepath: '.' })
      await remove({ fs, dir, gitdir, filepath: 'gone.txt' })
      const featureOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'feature',
        author,
      })

      await checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(`${dir}/conflict.txt`, 'one\nmaster\nthree\n')
      await fs.write(`${dir}/ours.txt`, 'master\n')
      await fs.write(`${dir}/both.txt`, 'master start\nmiddle\nend\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      const masterOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'master',
        author,
      })
      return {
        fs,
        dir,
        gitdir,
        gitdirsmfullpath,
        baseOid,
        featureOid,
        masterOid,
      }
    }

    async function mergeFeature(repo, options = {}) {
      const { fs, dir, gitdir } = repo
      let error = null
      try {
        await merge({
          fs,
          dir,
          gitdir,
          ours: 'master',
          theirs: 'feature',
          abortOnConflict: false,
          author,
          ...options,
        })
      } catch (e) {
        error = e
      }
      expect(error).not.toBeNull()
      return error
    }

    async function readIndex(repo) {
      const { fs, gitdirsmfullpath } = repo
      return GitIndexManager.acquire(
        { fs, gitdir: gitdirsmfullpath, cache: {} },
        async index => ({
          unmergedPaths: index.unmergedPaths,
          entries: new Map(
            index.entriesFlat.map(e => [`${e.path}:${e.flags.stage}`, e])
          ),
        })
      )
    }

    describe('a directory on one side, a file on the other', () => {
      // Every object the tree of commit or tree `oid` points at has the type
      // its entry says, as `git fsck` checks.
      async function expectValidTree({ fs, gitdir }, oid) {
        const { tree } = await readTree({ fs, gitdir, oid })
        for (const entry of tree) {
          const { type } = await readObject({ fs, gitdir, oid: entry.oid })
          expect([entry.path, type]).toEqual([entry.path, entry.type])
          if (type === 'tree') await expectValidTree({ fs, gitdir }, entry.oid)
        }
      }

      // No path in the index is both merged (stage 0) and unmerged, which
      // git rejects.
      async function expectValidIndex({ fs, gitdir }) {
        const stages = await GitIndexManager.acquire(
          {
            fs,
            gitdir: await discoverGitdir({ fsp: fs, dotgit: gitdir }),
            cache: {},
          },
          async index => index.entriesFlat.map(e => [e.path, e.flags.stage])
        )
        const merged = stages.filter(([, stage]) => stage === 0)
        const unmerged = new Set(
          stages.filter(([, stage]) => stage > 0).map(([path]) => path)
        )
        expect(merged.filter(([path]) => unmerged.has(path))).toEqual([])
      }

      // base: x/a, x/b and what `base` adds. master makes `master` in the
      // working tree; feature gets the tree `feature` builds (from objects,
      // since checkout cannot turn a file back into a directory).
      /**
       * @param {string} name
       * @param {Object} changes
       * @param {(repo: any) => Promise<any>} [changes.base]
       * @param {(repo: any) => Promise<any>} changes.master
       * @param {(helpers: any) => Promise<any[]>} changes.feature
       */
      async function setupDirFile(name, { base, master, feature }) {
        const { fs, dir, gitdir } = await makeFixtureAsSubmodule(name)
        await init({ fs, dir, gitdir })
        await fs.write(`${dir}/x/a`, 'a\n')
        await fs.write(`${dir}/x/b`, 'b\n')
        if (base) await base({ fs, dir, gitdir })
        await add({ fs, dir, gitdir, filepath: '.' })
        const baseOid = await gitCommit({
          fs,
          dir,
          gitdir,
          message: 'base',
          author,
        })
        const blob = async (path, content) => ({
          path,
          mode: '100644',
          type: /** @type {const} */ ('blob'),
          oid: await writeBlob({ fs, gitdir, blob: Buffer.from(content) }),
        })
        const tree = async (path, entries) => ({
          path,
          mode: '040000',
          type: /** @type {const} */ ('tree'),
          oid: await writeTree({ fs, gitdir, tree: entries }),
        })
        await gitCommit({
          fs,
          dir,
          gitdir,
          ref: 'refs/heads/feature',
          parent: [baseOid],
          tree: (await tree('.', await feature({ blob, tree }))).oid,
          message: 'feature',
          author,
        })
        const repo = { fs, dir, gitdir }
        await master(repo)
        await gitCommit({ fs, dir, gitdir, message: 'master', author })
        return repo
      }

      // Turns the directory x into a file in the working tree.
      async function toFile({ fs, dir, gitdir }) {
        for (const filepath of ['x/a', 'x/b']) {
          await fs.rm(`${dir}/${filepath}`)
          await remove({ fs, dir, gitdir, filepath })
        }
        await fs.rmdir(`${dir}/x`)
        await fs.write(`${dir}/x`, 'file\n')
        await add({ fs, dir, gitdir, filepath: 'x' })
      }

      it('moves their file aside when ours changed the directory, like git', async () => {
        const repo = await setupDirFile('tmp-merge-df-theirs-file', {
          feature: async ({ blob }) => [await blob('x', 'file\n')],
          master: async ({ fs, dir, gitdir }) => {
            await fs.write(`${dir}/x/b`, 'b2\n')
            await add({ fs, dir, gitdir, filepath: 'x/b' })
          },
        })
        const { fs, dir, gitdir } = repo

        const error = await mergeFeature(repo)
        expect(error.code).toBe(Errors.MergeConflictError.code)
        expect(error.data.filepaths.sort()).toEqual(['x/b', 'x~feature'])
        // Their deletions are applied, our edit is kept, nothing is lost.
        expect(await fs.exists(`${dir}/x/a`)).toBe(false)
        expect(await fs.read(`${dir}/x/b`, 'utf8')).toBe('b2\n')
        expect(await fs.read(`${dir}/x~feature`, 'utf8')).toBe('file\n')
        const files = await listUnmergedFiles({ fs, dir, gitdir })
        expect(
          files.map(({ filepath, base, ours, theirs }) => [
            filepath,
            ...[base, ours, theirs].map(side => side && side.mode),
          ])
        ).toEqual([
          ['x/b', '100644', '100644', undefined],
          ['x~feature', undefined, undefined, '100644'],
        ])
        expect(await listFiles({ fs, dir, gitdir })).toEqual([
          'x/b',
          'x~feature',
        ])
        await expectValidIndex(repo)

        // Keeping both finishes the merge with a valid tree.
        await add({ fs, dir, gitdir, filepath: '.' })
        const oid = await gitCommit({
          fs,
          dir,
          gitdir,
          message: 'merge',
          author,
          parent: [
            await resolveRef({ fs, gitdir, ref: 'master' }),
            await resolveRef({ fs, gitdir, ref: 'feature' }),
          ],
        })
        await expectValidTree(repo, oid)
      })

      it('moves our file aside when theirs changed the directory, like git', async () => {
        const repo = await setupDirFile('tmp-merge-df-ours-file', {
          feature: async ({ blob, tree }) => [
            await tree('x', [await blob('a', 'a\n'), await blob('b', 'b2\n')]),
          ],
          master: toFile,
        })
        const { fs, dir, gitdir } = repo

        const error = await mergeFeature(repo)
        expect(error.code).toBe(Errors.MergeConflictError.code)
        expect(error.data.filepaths.sort()).toEqual(['x/b', 'x~HEAD'])
        expect(await fs.read(`${dir}/x/b`, 'utf8')).toBe('b2\n')
        expect(await fs.read(`${dir}/x~HEAD`, 'utf8')).toBe('file\n')
        const files = await listUnmergedFiles({ fs, dir, gitdir })
        expect(
          files.map(({ filepath, base, ours, theirs }) => [
            filepath,
            ...[base, ours, theirs].map(side => side && side.mode),
          ])
        ).toEqual([
          ['x/b', '100644', undefined, '100644'],
          ['x~HEAD', undefined, '100644', undefined],
        ])
        expect(await listFiles({ fs, dir, gitdir })).toEqual(['x/b', 'x~HEAD'])
        await expectValidIndex(repo)
      })

      it('reports a conflict when ours adds to the directory, like git', async () => {
        // Without a conflict anywhere else, this used to commit a tree whose
        // file entry pointed at a tree.
        const repo = await setupDirFile('tmp-merge-df-ours-adds', {
          feature: async ({ blob }) => [await blob('x', 'file\n')],
          master: async ({ fs, dir, gitdir }) => {
            await fs.write(`${dir}/x/new`, 'new\n')
            await add({ fs, dir, gitdir, filepath: 'x/new' })
          },
        })
        const { fs, dir, gitdir } = repo
        const masterOid = await resolveRef({ fs, gitdir, ref: 'master' })

        const error = await mergeFeature(repo)
        expect(error.code).toBe(Errors.MergeConflictError.code)
        expect(error.data.filepaths).toEqual(['x~feature'])
        expect(await resolveRef({ fs, gitdir, ref: 'master' })).toBe(masterOid)
        expect(await fs.read(`${dir}/x/new`, 'utf8')).toBe('new\n')
        expect(await fs.read(`${dir}/x~feature`, 'utf8')).toBe('file\n')
      })

      it('picks a free name for the file it moves aside, like git', async () => {
        const repo = await setupDirFile('tmp-merge-df-name-taken', {
          feature: async ({ blob }) => [await blob('x', 'file\n')],
          master: async ({ fs, dir, gitdir }) => {
            await fs.write(`${dir}/x/b`, 'b2\n')
            await fs.write(`${dir}/x~feature`, 'taken\n')
            await add({ fs, dir, gitdir, filepath: '.' })
          },
        })
        const { fs, dir } = repo

        const error = await mergeFeature(repo)
        expect(error.data.filepaths.sort()).toEqual(['x/b', 'x~feature_0'])
        expect(await fs.read(`${dir}/x~feature`, 'utf8')).toBe('taken\n')
        expect(await fs.read(`${dir}/x~feature_0`, 'utf8')).toBe('file\n')
      })

      it('picks a name no tree has, like git', async () => {
        // x~feature is in the base and ours; theirs deleted it.
        const repo = await setupDirFile('tmp-merge-df-name-in-trees', {
          base: ({ fs, dir }) => fs.write(`${dir}/x~feature`, 'base\n'),
          feature: async ({ blob }) => [await blob('x', 'file\n')],
          master: async ({ fs, dir, gitdir }) => {
            await fs.write(`${dir}/x/b`, 'b2\n')
            await add({ fs, dir, gitdir, filepath: 'x/b' })
          },
        })
        const { fs, dir, gitdir } = repo

        const error = await mergeFeature(repo)
        expect(error.data.filepaths.sort()).toEqual(['x/b', 'x~feature_0'])
        expect(await fs.exists(`${dir}/x~feature`)).toBe(false)
        expect(await fs.read(`${dir}/x~feature_0`, 'utf8')).toBe('file\n')
        expect(await listFiles({ fs, dir, gitdir })).toEqual([
          'x/b',
          'x~feature_0',
        ])
        await expectValidIndex(repo)
      })

      it('names the file after the branch with / made _, like git', async () => {
        const repo = await setupDirFile('tmp-merge-df-branch-slash', {
          feature: async ({ blob }) => [await blob('x', 'file\n')],
          master: async ({ fs, dir, gitdir }) => {
            await fs.write(`${dir}/x/b`, 'b2\n')
            await add({ fs, dir, gitdir, filepath: 'x/b' })
          },
        })
        const { fs, dir, gitdir } = repo
        await branch({ fs, dir, gitdir, ref: 'feat/x', object: 'feature' })

        const error = await mergeFeature(repo, { theirs: 'feat/x' })
        expect(error.data.filepaths.sort()).toEqual(['x/b', 'x~feat_x'])
        expect(await fs.read(`${dir}/x~feat_x`, 'utf8')).toBe('file\n')
      })

      it('refuses a submodule in place of a directory, writing nothing', async () => {
        const repo = await setupDirFile('tmp-merge-df-submodule', {
          feature: async () => [
            {
              path: 'x',
              mode: '160000',
              type: /** @type {const} */ ('commit'),
              oid: '1'.repeat(40),
            },
          ],
          master: async ({ fs, dir, gitdir }) => {
            await fs.write(`${dir}/x/b`, 'b2\n')
            await add({ fs, dir, gitdir, filepath: 'x/b' })
          },
        })
        const { fs, dir, gitdir } = repo

        const error = await mergeFeature(repo)
        expect(error.code).toBe(Errors.MergeNotSupportedError.code)
        expect(await fs.read(`${dir}/x/a`, 'utf8')).toBe('a\n')
        expect(await fs.read(`${dir}/x/b`, 'utf8')).toBe('b2\n')
        expect(await listFiles({ fs, dir, gitdir })).toEqual(['x/a', 'x/b'])
        expect(await listUnmergedFiles({ fs, dir, gitdir })).toEqual([])
      })

      it('lets the file take the place of a directory nothing is left in', async () => {
        const repo = await setupDirFile('tmp-merge-df-emptied', {
          feature: async ({ blob }) => [await blob('x', 'file\n')],
          master: async ({ fs, dir, gitdir }) => {
            await fs.rm(`${dir}/x/b`)
            await remove({ fs, dir, gitdir, filepath: 'x/b' })
          },
        })
        const { fs, dir, gitdir } = repo

        await merge({
          fs,
          dir,
          gitdir,
          ours: 'master',
          theirs: 'feature',
          author,
        })
        const oid = await resolveRef({ fs, gitdir, ref: 'master' })
        await expectValidTree(repo, oid)
        const { tree } = await readTree({ fs, gitdir, oid })
        expect(tree.map(entry => [entry.path, entry.type])).toEqual([
          ['x', 'blob'],
        ])
      })
    })

    it('reports a conflict when both sides add a file with different modes', async () => {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
        'tmp-merge-add-add-modes'
      )
      await init({ fs, dir, gitdir })
      await fs.write(`${dir}/keep.txt`, 'keep\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })
      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      // The texts merge cleanly, but git cannot choose between the modes.
      await fs.write(`${dir}/x`, '', { mode: 0o777 })
      await add({ fs, dir, gitdir, filepath: 'x' })
      await gitCommit({ fs, dir, gitdir, message: 'feature', author })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(`${dir}/x`, 'hello\n')
      await add({ fs, dir, gitdir, filepath: 'x' })
      await gitCommit({ fs, dir, gitdir, message: 'master', author })
      const repo = { fs, dir, gitdir }

      const error = await mergeFeature(repo)
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(error.data.filepaths).toEqual(['x'])
      const [file] = await listUnmergedFiles({ fs, dir, gitdir })
      const sides = [file.base, file.ours, file.theirs]
      expect(sides.map(side => side && side.mode)).toEqual([
        undefined,
        '100644',
        '100755',
      ])
      expect(await fs.read(`${dir}/x`, 'utf8')).toBe('hello\n')
    })

    it('reports a conflict when both sides add the same text with different modes', async () => {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
        'tmp-merge-add-add-same-text'
      )
      await init({ fs, dir, gitdir })
      await fs.write(`${dir}/keep.txt`, 'keep\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })
      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fs.write(`${dir}/x`, 'same\n', { mode: 0o777 })
      await add({ fs, dir, gitdir, filepath: 'x' })
      await gitCommit({ fs, dir, gitdir, message: 'feature', author })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(`${dir}/x`, 'same\n')
      await add({ fs, dir, gitdir, filepath: 'x' })
      await gitCommit({ fs, dir, gitdir, message: 'master', author })

      const error = await mergeFeature({ fs, dir, gitdir })
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(error.data.filepaths).toEqual(['x'])
      const [file] = await listUnmergedFiles({ fs, dir, gitdir })
      const sides = [file.base, file.ours, file.theirs]
      expect(sides.map(side => side && side.mode)).toEqual([
        undefined,
        '100644',
        '100755',
      ])
    })

    it('stages submodule changes the way git does', async () => {
      const { fs, dir, gitdir, gitdirsmfullpath } =
        await makeFixtureAsSubmodule('tmp-merge-gitlink')
      await init({ fs, dir, gitdir })
      // Submodules are never checked out, so their commits need not exist.
      const s1 = '1'.repeat(40)
      const s2 = '2'.repeat(40)
      const blob = async content => ({
        mode: '100644',
        type: /** @type {const} */ ('blob'),
        oid: await writeBlob({ fs, gitdir, blob: Buffer.from(content) }),
      })
      const gitlink = oid => ({
        mode: '160000',
        type: /** @type {const} */ ('commit'),
        oid,
      })
      // base: conflict.txt, submodules gone, kept and sub
      // feature: edits conflict.txt, bumps sub, removes gone and kept, adds
      // added
      const baseOid = await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'refs/heads/master',
        parent: [],
        tree: await writeTree({
          fs,
          gitdir,
          tree: [
            { path: 'conflict.txt', ...(await blob('one\ntwo\nthree\n')) },
            { path: 'gone', ...gitlink(s1) },
            { path: 'kept', ...gitlink(s1) },
            { path: 'sub', ...gitlink(s1) },
          ],
        }),
        message: 'base',
        author,
      })
      const featureOid = await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'refs/heads/feature',
        parent: [baseOid],
        tree: await writeTree({
          fs,
          gitdir,
          tree: [
            { path: 'added', ...gitlink(s2) },
            { path: 'conflict.txt', ...(await blob('one\nfeature\nthree\n')) },
            { path: 'sub', ...gitlink(s2) },
          ],
        }),
        message: 'feature',
        author,
      })
      await checkout({ fs, dir, gitdir, ref: 'master', force: true })
      await fs.write(`${dir}/conflict.txt`, 'one\nmaster\nthree\n')
      await add({ fs, dir, gitdir, filepath: 'conflict.txt' })
      const masterOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'master',
        author,
      })
      // A submodule with files in it, as if it had been cloned.
      await fs.write(`${dir}/kept/file.txt`, 'kept\n')
      const repo = { fs, dir, gitdir, gitdirsmfullpath }

      const error = await mergeFeature(repo)
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(error.data.filepaths).toEqual(['conflict.txt'])
      const { entries } = await readIndex(repo)
      const gitlinks = [...entries.values()]
        .filter(entry => entry.mode === 0o160000)
        .map(entry => [entry.path, entry.flags.stage, entry.oid])
      expect(gitlinks).toEqual([
        ['added', 0, s2],
        ['sub', 0, s2],
      ])
      // Like git, a new submodule gets an empty directory, and the directory
      // of a removed one goes, unless files are in it.
      expect((await fs.lstat(`${dir}/added`)).isDirectory()).toBe(true)
      expect(await fs.readdir(`${dir}/added`)).toEqual([])
      expect(await fs.exists(`${dir}/gone`)).toBe(false)
      expect(await fs.read(`${dir}/kept/file.txt`, 'utf8')).toBe('kept\n')

      // The commit that finishes the merge has their submodule changes.
      await fs.write(`${dir}/conflict.txt`, 'one\nresolved\nthree\n')
      await add({ fs, dir, gitdir, filepath: 'conflict.txt' })
      const mergeOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'merge',
        author,
        parent: [masterOid, featureOid],
      })
      const resolved = await blob('one\nresolved\nthree\n')
      const { tree } = await readTree({ fs, gitdir, oid: mergeOid })
      expect(tree.map(entry => [entry.path, entry.mode, entry.oid])).toEqual([
        ['added', '160000', s2],
        ['conflict.txt', '100644', resolved.oid],
        ['sub', '160000', s2],
      ])
    })

    it('keeps an untracked file in a directory the merge removes', async () => {
      const repo = await setup('tmp-merge-removed-dir-untracked')
      const { fs, dir, gitdir } = repo
      await checkout({ fs, dir, gitdir, ref: 'feature' })
      await fs.rm(`${dir}/sub/nested.txt`)
      await remove({ fs, dir, gitdir, filepath: 'sub/nested.txt' })
      await gitCommit({ fs, dir, gitdir, message: 'remove sub', author })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(`${dir}/sub/untracked.txt`, 'untracked\n')

      const error = await mergeFeature(repo)
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(await fs.exists(`${dir}/sub/nested.txt`)).toBe(false)
      expect(await fs.read(`${dir}/sub/untracked.txt`, 'utf8')).toBe(
        'untracked\n'
      )
      expect(await listFiles({ fs, dir, gitdir })).not.toContain(
        'sub/nested.txt'
      )
    })

    it('stages a file both sides changed the same way with its stats', async () => {
      const { fs, dir, gitdir, gitdirsmfullpath } =
        await makeFixtureAsSubmodule('tmp-merge-same-change')
      await init({ fs, dir, gitdir })
      await fs.write(`${dir}/conflict.txt`, 'one\ntwo\nthree\n')
      await fs.write(`${dir}/twin.txt`, 'base\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })
      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fs.write(`${dir}/conflict.txt`, 'one\nfeature\nthree\n')
      await fs.write(`${dir}/twin.txt`, 'both\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'feature', author })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(`${dir}/conflict.txt`, 'one\nmaster\nthree\n')
      await fs.write(`${dir}/twin.txt`, 'both\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'master', author })
      const repo = { fs, dir, gitdir, gitdirsmfullpath }
      const twin = async () => {
        const { oid, mode, size, mtimeSeconds, mtimeNanoseconds, ino } = (
          await readIndex(repo)
        ).entries.get('twin.txt:0')
        return { oid, mode, size, mtimeSeconds, mtimeNanoseconds, ino }
      }
      const before = await twin()
      expect(before.size).toBe(5)

      const error = await mergeFeature(repo)
      expect(error.code).toBe(Errors.MergeConflictError.code)
      // The merge leaves the file alone, so its entry keeps the file's stats.
      expect(await twin()).toEqual(before)
    })

    it('writes the whole result when the working tree was never checked out', async () => {
      const { fs, dir, gitdir, gitdirsmfullpath } =
        await makeFixtureAsSubmodule('tmp-merge-not-checked-out')
      await init({ fs, dir, gitdir })
      const blob = async content => ({
        mode: '100644',
        type: /** @type {const} */ ('blob'),
        oid: await writeBlob({ fs, gitdir, blob: Buffer.from(content) }),
      })
      const commitTree = async (ref, parent, files) =>
        gitCommit({
          fs,
          dir,
          gitdir,
          ref,
          parent,
          message: ref,
          author,
          tree: await writeTree({
            fs,
            gitdir,
            tree: await Promise.all(
              Object.entries(files).map(async ([path, content]) => ({
                path,
                ...(await blob(content)),
              }))
            ),
          }),
        })
      // Commits made without a working tree: the index stays empty.
      const baseOid = await commitTree('refs/heads/master', [], {
        'conflict.txt': 'one\ntwo\nthree\n',
        'keep.txt': 'keep\n',
      })
      await commitTree('refs/heads/feature', [baseOid], {
        'added.txt': 'added\n',
        'conflict.txt': 'one\nfeature\nthree\n',
        'keep.txt': 'keep\n',
      })
      await commitTree('refs/heads/master', [baseOid], {
        'conflict.txt': 'one\nmaster\nthree\n',
        'keep.txt': 'keep\n',
      })
      const repo = { fs, dir, gitdir, gitdirsmfullpath }

      const error = await mergeFeature(repo)
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(await fs.read(`${dir}/keep.txt`, 'utf8')).toBe('keep\n')
      expect(await fs.read(`${dir}/added.txt`, 'utf8')).toBe('added\n')
      expect(await fs.read(`${dir}/conflict.txt`, 'utf8')).toContain('<<<<<<<')
      const index = await readIndex(repo)
      expect([...index.entries.keys()]).toEqual([
        'added.txt:0',
        'conflict.txt:1',
        'conflict.txt:2',
        'conflict.txt:3',
        'keep.txt:0',
      ])
    })

    it('leaves the working tree and index the way git does', async () => {
      const repo = await setup('tmp-merge-conflict-state')
      const { fs, dir, gitdir, baseOid, featureOid, masterOid } = repo

      const error = await mergeFeature(repo)
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(error.data.filepaths).toEqual(['conflict.txt'])

      // Only the conflicted file is unmerged, with all three versions.
      const index = await readIndex(repo)
      expect(index.unmergedPaths).toEqual(['conflict.txt'])
      expect(await fs.read(`${dir}/conflict.txt`, 'utf8')).toBe(
        'one\n<<<<<<< HEAD\nmaster\n=======\nfeature\n>>>>>>> feature\nthree\n'
      )
      const stageOids = [1, 2, 3].map(
        stage => index.entries.get(`conflict.txt:${stage}`).oid
      )
      const blob = async (oid, filepath) =>
        (await readBlob({ fs, gitdir, oid, filepath })).oid
      expect(stageOids).toEqual([
        await blob(baseOid, 'conflict.txt'),
        await blob(masterOid, 'conflict.txt'),
        await blob(featureOid, 'conflict.txt'),
      ])

      // Everything else the merge changed is written and staged.
      expect(await fs.read(`${dir}/theirs.txt`, 'utf8')).toBe('feature\n')
      expect(await status({ fs, dir, gitdir, filepath: 'theirs.txt' })).toBe(
        'modified'
      )
      expect(await fs.read(`${dir}/both.txt`, 'utf8')).toBe(
        'master start\nmiddle\nfeature end\n'
      )
      expect(await status({ fs, dir, gitdir, filepath: 'both.txt' })).toBe(
        'modified'
      )
      expect(
        await status({ fs, dir, gitdir, filepath: 'sub/nested.txt' })
      ).toBe('modified')
      expect(await fs.read(`${dir}/added.txt`, 'utf8')).toBe('added\n')
      expect(await status({ fs, dir, gitdir, filepath: 'added.txt' })).toBe(
        'added'
      )
      expect(await fs.exists(`${dir}/gone.txt`)).toBe(false)
      expect(await status({ fs, dir, gitdir, filepath: 'gone.txt' })).toBe(
        'deleted'
      )
      expect(await status({ fs, dir, gitdir, filepath: 'ours.txt' })).toBe(
        'unmodified'
      )
      expect(await status({ fs, dir, gitdir, filepath: 'same.txt' })).toBe(
        'unmodified'
      )
      // The mode recorded for a rewritten file is the one from the tree.
      const { tree } = await readTree({ fs, gitdir, oid: featureOid })
      const treeModes = tree.map(entry => [entry.path, entry.mode])
      expect(treeModes).toContainEqual([
        'run.sh',
        index.entries.get('run.sh:0').mode.toString(8),
      ])

      // Resolving, adding and committing finishes the merge with their
      // changes included, exactly like `git commit` would.
      await fs.write(`${dir}/conflict.txt`, 'one\nresolved\nthree\n')
      await add({ fs, dir, gitdir, filepath: 'conflict.txt' })
      const mergeOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'merge',
        author,
        parent: [masterOid, featureOid],
      })
      const read = async filepath =>
        Buffer.from(
          (await readBlob({ fs, gitdir, oid: mergeOid, filepath })).blob
        ).toString('utf8')
      expect(await read('conflict.txt')).toBe('one\nresolved\nthree\n')
      expect(await read('theirs.txt')).toBe('feature\n')
      expect(await read('both.txt')).toBe('master start\nmiddle\nfeature end\n')
      expect(await read('added.txt')).toBe('added\n')
      expect(await read('ours.txt')).toBe('master\n')
      await expect(read('gone.txt')).rejects.toMatchObject({
        code: Errors.NotFoundError.code,
      })
      const matrix = await statusMatrix({ fs, dir, gitdir })
      expect(matrix.every(row => row.slice(1).join() === '1,1,1')).toBe(true)
    })

    it('keeps local changes in files the merge does not touch', async () => {
      const repo = await setup('tmp-merge-conflict-untouched')
      const { fs, dir, gitdir } = repo
      await fs.write(`${dir}/same.txt`, 'local\n')
      await fs.write(`${dir}/untracked.txt`, 'untracked\n')

      const error = await mergeFeature(repo)
      expect(error.code).toBe(Errors.MergeConflictError.code)

      expect(await fs.read(`${dir}/same.txt`, 'utf8')).toBe('local\n')
      expect(await status({ fs, dir, gitdir, filepath: 'same.txt' })).toBe(
        '*modified'
      )
      expect(await fs.read(`${dir}/untracked.txt`, 'utf8')).toBe('untracked\n')
      expect(await fs.read(`${dir}/conflict.txt`, 'utf8')).toContain('<<<<<<<')
    })

    it('writes nothing with dryRun', async () => {
      const repo = await setup('tmp-merge-dry-run')
      const { fs, dir, gitdir } = repo
      await fs.write(`${dir}/theirs.txt`, 'local\n')

      const error = await mergeFeature(repo, { dryRun: true })
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(await fs.read(`${dir}/theirs.txt`, 'utf8')).toBe('local\n')
      expect(await fs.read(`${dir}/conflict.txt`, 'utf8')).toBe(
        'one\nmaster\nthree\n'
      )
      expect(await status({ fs, dir, gitdir, filepath: 'conflict.txt' })).toBe(
        'unmodified'
      )
    })

    it('replaces a directory with a file the way git does', async () => {
      const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
        'tmp-merge-dir-to-file'
      )
      await init({ fs, dir, gitdir })
      await fs.write(`${dir}/conflict.txt`, 'one\ntwo\nthree\n')
      await fs.write(`${dir}/sub/nested.txt`, 'base\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      const baseOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'base',
        author,
      })
      // feature turns the directory into a file. Built from objects, since
      // checkout does not make that change.
      const blob = async content => ({
        mode: '100644',
        type: /** @type {const} */ ('blob'),
        oid: await writeBlob({ fs, gitdir, blob: Buffer.from(content) }),
      })
      await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'refs/heads/feature',
        parent: [baseOid],
        tree: await writeTree({
          fs,
          gitdir,
          tree: [
            { path: 'conflict.txt', ...(await blob('one\nfeature\nthree\n')) },
            { path: 'sub', ...(await blob('now a file\n')) },
          ],
        }),
        message: 'feature',
        author,
      })
      await fs.write(`${dir}/conflict.txt`, 'one\nmaster\nthree\n')
      await add({ fs, dir, gitdir, filepath: 'conflict.txt' })
      await gitCommit({ fs, dir, gitdir, message: 'master', author })
      const repo = { fs, dir, gitdir }

      const error = await mergeFeature(repo)
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(error.data.filepaths).toEqual(['conflict.txt'])
      expect(await fs.read(`${dir}/sub`, 'utf8')).toBe('now a file\n')
      expect(await statusMatrix({ fs, dir, gitdir })).toEqual([
        ['conflict.txt', 1, 2, 3],
        ['sub', 0, 2, 2],
        ['sub/nested.txt', 1, 0, 0],
      ])
      // statusMatrix would not show an index entry left inside the directory.
      expect(await listFiles({ fs, dir, gitdir })).toEqual([
        'conflict.txt',
        'sub',
      ])
    })
  })

  describe('binary files and other bytes', () => {
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    // Commits base on master, theirs on a branch, then ours on master.
    const setup = async (files, theirName = 'feature') => {
      const { fs, dir, gitdir } =
        await makeFixtureAsSubmodule('tmp-merge-binary')
      await init({ fs, dir, gitdir })
      const commitAll = async version => {
        for (const [filepath, versions] of Object.entries(files)) {
          await fs.write(`${dir}/${filepath}`, versions[version])
        }
        await add({ fs, dir, gitdir, filepath: '.' })
        await gitCommit({ fs, dir, gitdir, message: version, author })
      }
      await commitAll('base')
      await branch({ fs, dir, gitdir, ref: theirName, checkout: true })
      await commitAll('theirs')
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await commitAll('ours')
      return { fs, dir, gitdir, theirName }
    }
    // Merges theirs into master, writing conflicts out; returns the error.
    const tryMerge = async ({ fs, dir, gitdir, theirName }, options = {}) => {
      try {
        await merge({
          fs,
          dir,
          gitdir,
          ours: 'master',
          theirs: theirName,
          abortOnConflict: false,
          author,
          ...options,
        })
        return null
      } catch (e) {
        return e
      }
    }
    const text = s => Buffer.from(s, 'utf8')
    // The bytes of a file in the merge commit (a clean merge leaves the
    // working tree alone).
    const merged = async ({ fs, gitdir }, filepath) => {
      const oid = await resolveRef({ fs, gitdir, ref: 'master' })
      return Array.from((await readBlob({ fs, gitdir, oid, filepath })).blob)
    }

    it('does not merge binary files and keeps other bytes intact', async () => {
      const { fs, dir, gitdir, gitdirsmfullpath } =
        await makeFixtureAsSubmodule('tmp-merge-binary')
      await init({ fs, dir, gitdir })
      // A NUL byte in the first 8000 bytes makes a file binary, like in git.
      const binary = {
        base: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x00, 1, 2, 3]),
        feature: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x00, 1, 2, 4]),
        master: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x00, 1, 2, 5]),
      }
      // Latin-1 text with a lone CR inside a line: not valid UTF-8 and not a
      // line ending git knows, but still text.
      const latin1 = {
        base: Buffer.from('caf\xe9\rcr\nmiddle\nend\n', 'latin1'),
        feature: Buffer.from('caf\xe9\rcr\nmiddle\nfeature\n', 'latin1'),
        master: Buffer.from('master caf\xe9\rcr\nmiddle\nend\n', 'latin1'),
        merged: Buffer.from('master caf\xe9\rcr\nmiddle\nfeature\n', 'latin1'),
      }
      const commitBoth = async (version, message) => {
        await fs.write(`${dir}/image.bin`, binary[version])
        await fs.write(`${dir}/latin1.txt`, latin1[version])
        await add({ fs, dir, gitdir, filepath: '.' })
        return gitCommit({ fs, dir, gitdir, message, author })
      }
      const baseOid = await commitBoth('base', 'base')
      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      const featureOid = await commitBoth('feature', 'feature')
      await checkout({ fs, dir, gitdir, ref: 'master' })
      const masterOid = await commitBoth('master', 'master')

      let error = null
      try {
        await merge({
          fs,
          dir,
          gitdir,
          ours: 'master',
          theirs: 'feature',
          abortOnConflict: false,
          author,
        })
      } catch (e) {
        error = e
      }
      expect(error).not.toBeNull()
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(error.data.filepaths).toEqual(['image.bin'])

      // Ours stays in the working tree, all three versions are in the index.
      expect(Array.from(await fs.read(`${dir}/image.bin`))).toEqual(
        Array.from(binary.master)
      )
      const index = await GitIndexManager.acquire(
        { fs, gitdir: gitdirsmfullpath, cache: {} },
        async index => index.entriesMap.get('image.bin').stages
      )
      const blob = async oid =>
        (await readBlob({ fs, gitdir, oid, filepath: 'image.bin' })).oid
      expect(index[0]).toBeUndefined()
      expect(index.slice(1).map(entry => entry.oid)).toEqual([
        await blob(baseOid),
        await blob(masterOid),
        await blob(featureOid),
      ])

      // The text file merged cleanly, byte for byte.
      expect(Array.from(await fs.read(`${dir}/latin1.txt`))).toEqual(
        Array.from(latin1.merged)
      )
      expect(await status({ fs, dir, gitdir, filepath: 'latin1.txt' })).toBe(
        'modified'
      )
    })

    it.each([
      [
        'base',
        {
          base: text('a\n\0\n'),
          ours: text('ours\n'),
          theirs: text('theirs\n'),
        },
      ],
      [
        'ours',
        {
          base: text('a\nb\nc\n'),
          ours: text('a\nb\n\0\n'),
          theirs: text('A\nb\nc\n'),
        },
      ],
      [
        'theirs',
        {
          base: text('a\nb\nc\n'),
          ours: text('A\nb\nc\n'),
          theirs: text('a\nb\n\0\n'),
        },
      ],
    ])('does not merge a file that is binary only in %s', async (_, files) => {
      const repo = await setup({ 'f.txt': files })
      const error = await tryMerge(repo)
      expect(error && error.code).toBe(Errors.MergeConflictError.code)
      expect(error.data.filepaths).toEqual(['f.txt'])
      expect(Array.from(await repo.fs.read(`${repo.dir}/f.txt`))).toEqual(
        Array.from(files.ours)
      )
    })

    it('treats a file as binary only for a NUL in its first 8000 bytes', async () => {
      // 100 lines of 100 bytes after the first line; byte `at` is set to NUL.
      const version = (at, first, last) => {
        const buffer = text(
          `${first}\n${`${'y'.repeat(99)}\n`.repeat(100)}${last}\n`
        )
        buffer[at] = 0
        return buffer
      }
      const files = at => ({
        'f.txt': {
          base: version(at, 'a', 'end'),
          ours: version(at, 'b', 'end'),
          theirs: version(at, 'a', 'END'),
        },
      })

      const binary = await setup(files(7999))
      const error = await tryMerge(binary)
      expect(error && error.code).toBe(Errors.MergeConflictError.code)
      expect(Array.from(await binary.fs.read(`${binary.dir}/f.txt`))).toEqual(
        Array.from(version(7999, 'b', 'end'))
      )

      const textual = await setup(files(8000))
      expect(await tryMerge(textual)).toBeNull()
      expect(await merged(textual, 'f.txt')).toEqual(
        Array.from(version(8000, 'b', 'END'))
      )
    })

    it('writes non-ASCII branch names into conflict markers as UTF-8', async () => {
      const repo = await setup(
        {
          'f.txt': {
            base: text('a\n'),
            ours: text('b\n'),
            theirs: text('c\n'),
          },
        },
        'fé-功能'
      )
      const error = await tryMerge(repo)
      expect(error && error.code).toBe(Errors.MergeConflictError.code)
      expect(await repo.fs.read(`${repo.dir}/f.txt`, 'utf8')).toBe(
        '<<<<<<< HEAD\nb\n=======\nc\n>>>>>>> fé-功能\n'
      )
    })

    it('gives custom merge drivers UTF-8 strings', async () => {
      const repo = await setup(
        {
          'f.txt': {
            base: text('ä\n'),
            ours: text('ö\n'),
            theirs: text('功\n'),
          },
        },
        'fé-功能'
      )
      let seen = null
      const mergeDriver = ({ branches, contents }) => {
        seen = { branches, contents }
        return { cleanMerge: true, mergedText: `${contents[1]}${contents[2]}` }
      }
      expect(await tryMerge(repo, { mergeDriver })).toBeNull()
      expect(seen).toEqual({
        branches: ['base', 'HEAD', 'fé-功能'],
        contents: ['ä\n', 'ö\n', '功\n'],
      })
      expect(await merged(repo, 'f.txt')).toEqual(Array.from(text('ö\n功\n')))
    })

    it('still calls custom merge drivers for binary files', async () => {
      const repo = await setup({
        'f.bin': {
          base: text('\0base é\n'),
          ours: text('\0ours\n'),
          theirs: text('\0theirs 功\n'),
        },
      })
      let seen = null
      const mergeDriver = ({ contents, path }) => {
        seen = { contents, path }
        return { cleanMerge: true, mergedText: contents[2] }
      }
      expect(await tryMerge(repo, { mergeDriver })).toBeNull()
      expect(seen).toEqual({
        contents: ['\0base é\n', '\0ours\n', '\0theirs 功\n'],
        path: 'f.bin',
      })
      expect(await merged(repo, 'f.bin')).toEqual(
        Array.from(text('\0theirs 功\n'))
      )
    })
  })

  describe('conflict markers', () => {
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    it('labels our side HEAD when ours is the checked-out branch, like git', async () => {
      for (const ours of [undefined, 'master']) {
        const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
          `tmp-merge-label-${ours || 'default'}`
        )
        await init({ fs, dir, gitdir })
        await fs.write(`${dir}/file.txt`, 'base\n')
        await add({ fs, dir, gitdir, filepath: 'file.txt' })
        await gitCommit({ fs, dir, gitdir, message: 'base', author })
        await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
        await fs.write(`${dir}/file.txt`, 'feature change\n')
        await add({ fs, dir, gitdir, filepath: 'file.txt' })
        await gitCommit({ fs, dir, gitdir, message: 'feature', author })
        await checkout({ fs, dir, gitdir, ref: 'master' })
        await fs.write(`${dir}/file.txt`, 'master change\n')
        await add({ fs, dir, gitdir, filepath: 'file.txt' })
        await gitCommit({ fs, dir, gitdir, message: 'master change', author })

        let error = null
        try {
          await merge({
            fs,
            dir,
            gitdir,
            ours,
            theirs: 'feature',
            abortOnConflict: false,
            author,
          })
        } catch (e) {
          error = e
        }
        expect(error).not.toBeNull()
        expect(error.code).toBe(Errors.MergeConflictError.code)
        expect(await fs.read(`${dir}/file.txt`, 'utf8')).toBe(
          '<<<<<<< HEAD\nmaster change\n=======\nfeature change\n>>>>>>> feature\n'
        )
      }
    })
  })
})
