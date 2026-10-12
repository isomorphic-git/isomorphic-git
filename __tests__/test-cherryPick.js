/* eslint-env node, browser, jasmine */

import { join } from 'path'

import {
  Errors,
  merge,
  cherryPick,
  init,
  commit as gitCommit,
  add,
  branch,
  checkout,
  readCommit,
  resolveRef,
  log,
  remove,
  setConfig,
  status,
  statusMatrix,
  writeBlob,
  writeTree,
} from 'isomorphic-git'
import { GitIndexManager } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('cherryPick', () => {
  it('simple cherry-pick without conflicts', async () => {
    // create a dummy repository so all objects exist
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-1')

    await init({ fs, dir, gitdir })

    const author = {
      name: 'Test User',
      email: 'test@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    // Set user.name and user.email in git config so commit() can default where needed
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: author.name })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: author.email,
    })

    // Create base commit on master
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base commit', author })

    // Create feature branch and a commit to cherry-pick
    await branch({ fs, dir, gitdir, ref: 'feature' })
    await checkout({ fs, dir, gitdir, ref: 'feature' })
    await fs._writeFile(join(dir, 'feature.txt'), 'feature change\n')
    await add({ fs, dir, gitdir, filepath: 'feature.txt' })
    const featureOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'feature commit',
      author: {
        name: 'A',
        email: 'a@a.com',
        timestamp: 1234567890,
        timezoneOffset: 0,
      },
    })

    // Switch back to master and advance master so parent differs from feature's parent
    await checkout({ fs, dir, gitdir, ref: 'master' })
    // Create another commit on master to ensure cherry-pick creates a new commit object
    await fs._writeFile(join(dir, 'master.txt'), 'master updated\n')
    await add({ fs, dir, gitdir, filepath: 'master.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'master update', author })

    const newOid = await cherryPick({ fs, dir, gitdir, oid: featureOid })

    // Verify new commit was created
    expect(newOid).toBeDefined()
    expect(newOid).not.toBe(featureOid)

    // Verify workdir contains the cherry-picked change
    const featureContent = (await fs.read(join(dir, 'feature.txt'))).toString()
    expect(featureContent).toEqual('feature change\n')

    // Verify index/workdir are clean for the cherry-picked file
    const featureStatus = await status({
      fs,
      dir,
      gitdir,
      filepath: 'feature.txt',
    })
    expect(featureStatus).toBe('unmodified')

    // Verify it has single parent
    const { commit: newCommit } = await readCommit({ fs, gitdir, oid: newOid })
    expect(newCommit.parent.length).toBe(1)

    // Verify author is preserved
    const { commit: originalCommit } = await readCommit({
      fs,
      gitdir,
      oid: featureOid,
    })
    expect(newCommit.author.name).toEqual(originalCommit.author.name)
    expect(newCommit.author.email).toEqual(originalCommit.author.email)

    // Verify message is preserved
    expect(newCommit.message).toEqual(originalCommit.message)
  })

  it('cherry-pick with dryRun', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-2')

    await init({ fs, dir, gitdir })
    const author = {
      name: 'Test User',
      email: 'test@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: author.name })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: author.email,
    })
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base commit', author })

    await branch({ fs, dir, gitdir, ref: 'feature' })
    await checkout({ fs, dir, gitdir, ref: 'feature' })
    await fs._writeFile(join(dir, 'file.txt'), 'feature\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    const newestOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'feature',
      author,
    })
    await checkout({ fs, dir, gitdir, ref: 'master' })

    const beforeOid = await resolveRef({ fs, gitdir, ref: 'HEAD' })

    // Cherry-pick with dryRun
    const newOid = await cherryPick({
      fs,
      dir,
      gitdir,
      oid: newestOid,
      dryRun: true,
    })

    // Verify commit was created
    expect(newOid).toBeDefined()

    // Verify HEAD didn't move (dryRun mode)
    const afterOid = await resolveRef({ fs, gitdir, ref: 'HEAD' })
    expect(afterOid).toEqual(beforeOid)
  })

  it('reject merge commits', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-3')
    await init({ fs, dir, gitdir })
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Test User' })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: 'test@example.com',
    })

    // Create two branches and merge them to create a merge commit (non-conflicting)
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base' })

    // Create branch a and modify a separate file
    await branch({ fs, dir, gitdir, ref: 'a' })
    await checkout({ fs, dir, gitdir, ref: 'a' })
    await fs._writeFile(join(dir, 'a.txt'), 'a\n')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'a' })

    // Create branch b from master and modify a different file
    await checkout({ fs, dir, gitdir, ref: 'master' })
    await branch({ fs, dir, gitdir, ref: 'b' })
    await checkout({ fs, dir, gitdir, ref: 'b' })
    await fs._writeFile(join(dir, 'b.txt'), 'b\n')
    await add({ fs, dir, gitdir, filepath: 'b.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'b' })

    // Merge a into b to create a merge commit on b
    await checkout({ fs, dir, gitdir, ref: 'b' })
    // Use merge API to create a merge commit
    await merge({ fs, dir, gitdir, theirs: 'a' })

    // Find a merge commit (has 2 parents)
    const commits = await log({ fs, gitdir, ref: 'b' })
    const mergeCommit = commits.find(c => c.commit.parent.length > 1)
    expect(mergeCommit).toBeDefined()

    // Try to cherry-pick the merge commit
    if (!mergeCommit) throw new Error('Expected a merge commit')
    const parentCount = mergeCommit.commit.parent.length
    let error = null
    try {
      await cherryPick({ fs, dir, gitdir, oid: mergeCommit.oid })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.CherryPickMergeCommitError.code)
    expect(error.data.parentCount).toBe(parentCount)
  })

  it('abort on conflict (default) leaves workdir/index unchanged', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-conflict-1')
    await init({ fs, dir, gitdir })
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Tester' })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: 'test@example.com',
    })
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base' })

    // feature branch modifies file.txt
    await branch({ fs, dir, gitdir, ref: 'feature' })
    await checkout({ fs, dir, gitdir, ref: 'feature' })
    await fs._writeFile(join(dir, 'file.txt'), 'feature change\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    const featureOid = await gitCommit({ fs, dir, gitdir, message: 'feature' })

    // master modifies file.txt differently
    await checkout({ fs, dir, gitdir, ref: 'master' })
    await fs._writeFile(join(dir, 'file.txt'), 'master change\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'master change' })

    const beforeHead = await resolveRef({ fs, gitdir, ref: 'HEAD' })

    let error = null
    try {
      await cherryPick({ fs, dir, gitdir, oid: featureOid })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    // Workdir should be unchanged
    const content = (await fs.read(join(dir, 'file.txt'))).toString()
    expect(content).toEqual('master change\n')

    // HEAD should not have moved
    const afterHead = await resolveRef({ fs, gitdir, ref: 'HEAD' })
    expect(afterHead).toEqual(beforeHead)

    // Index should not have unmerged paths when abortOnConflict=true
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async index => {
      expect(index.unmergedPaths.length).toBe(0)
    })
  })

  it('abortOnConflict=false writes conflict markers and stages entries', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-conflict-2')
    await init({ fs, dir, gitdir })
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Tester' })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: 'test@example.com',
    })
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base' })

    // feature branch modifies file.txt
    await branch({ fs, dir, gitdir, ref: 'feature' })
    await checkout({ fs, dir, gitdir, ref: 'feature' })
    await fs._writeFile(join(dir, 'file.txt'), 'feature change\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    const featureOid = await gitCommit({ fs, dir, gitdir, message: 'feature' })

    // master modifies file.txt differently
    await checkout({ fs, dir, gitdir, ref: 'master' })
    await fs._writeFile(join(dir, 'file.txt'), 'master change\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'master change' })

    let error = null
    try {
      await cherryPick({
        fs,
        dir,
        gitdir,
        oid: featureOid,
        abortOnConflict: false,
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)

    // Workdir should contain conflict markers, labelled like git labels them
    const content = (await fs.read(join(dir, 'file.txt'))).toString()
    expect(content).toBe(
      `<<<<<<< HEAD\nmaster change\n=======\nfeature change\n>>>>>>> ${featureOid.slice(
        0,
        7
      )} (feature)\n`
    )

    // Index should have unmerged path for file.txt with multiple stages
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async index => {
      expect(index.unmergedPaths).toContain('file.txt')
      const stages = index.entriesMap.get('file.txt').stages
      // expect at least stages for base/ours/theirs
      expect(stages.length).toBeGreaterThanOrEqual(3)
    })
  })

  it('cherry-pick with custom committer', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-4')
    await init({ fs, dir, gitdir })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base', author })

    await branch({ fs, dir, gitdir, ref: 'feature' })
    await checkout({ fs, dir, gitdir, ref: 'feature' })
    await fs._writeFile(join(dir, 'file2.txt'), 'feature\n')
    await add({ fs, dir, gitdir, filepath: 'file2.txt' })
    const featureOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'feature',
      author,
    })

    await checkout({ fs, dir, gitdir, ref: 'master' })

    const customCommitter = {
      name: 'Cherry Picker',
      email: 'picker@example.com',
      timestamp: 1234567890,
      timezoneOffset: -120,
    }

    const newOid = await cherryPick({
      fs,
      dir,
      gitdir,
      oid: featureOid,
      committer: customCommitter,
    })
    const { commit: newCommit } = await readCommit({ fs, gitdir, oid: newOid })
    expect(newCommit.committer.name).toEqual(customCommitter.name)
    expect(newCommit.committer.email).toEqual(customCommitter.email)
  })

  it('noUpdateBranch option', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-5')
    await init({ fs, dir, gitdir })
    // Ensure committer identity exists for cherry-pick
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Committer' })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: 'committer@example.com',
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base', author })

    await branch({ fs, dir, gitdir, ref: 'feature' })
    await checkout({ fs, dir, gitdir, ref: 'feature' })
    await fs._writeFile(join(dir, 'file2.txt'), 'feature\n')
    await add({ fs, dir, gitdir, filepath: 'file2.txt' })
    const featureOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'feature',
      author,
    })

    await checkout({ fs, dir, gitdir, ref: 'master' })
    const beforeOid = await resolveRef({ fs, gitdir, ref: 'HEAD' })

    const newOid = await cherryPick({
      fs,
      dir,
      gitdir,
      oid: featureOid,
      noUpdateBranch: true,
    })
    expect(newOid).toBeDefined()

    const afterOid = await resolveRef({ fs, gitdir, ref: 'HEAD' })
    expect(afterOid).toEqual(beforeOid)
    const { commit } = await readCommit({ fs, gitdir, oid: newOid })
    expect(commit).toBeDefined()
  })

  it('cherry-pick creates new committer timestamp', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-6')
    await init({ fs, dir, gitdir })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base', author })

    await branch({ fs, dir, gitdir, ref: 'feature' })
    await checkout({ fs, dir, gitdir, ref: 'feature' })
    await fs._writeFile(join(dir, 'file2.txt'), 'feature\n')
    await add({ fs, dir, gitdir, filepath: 'file2.txt' })
    const featureOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'feature',
      author,
    })

    await checkout({ fs, dir, gitdir, ref: 'master' })
    const beforeTimestamp = Math.floor(Date.now() / 1000)
    // Ensure committer is not taken from author default by setting config
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Committer' })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: 'committer@example.com',
    })
    const newOid = await cherryPick({ fs, dir, gitdir, oid: featureOid })
    const afterTimestamp = Math.floor(Date.now() / 1000)

    const { commit: newCommit } = await readCommit({ fs, gitdir, oid: newOid })
    // Author timestamp should be preserved
    const { commit: originalCommit } = await readCommit({
      fs,
      gitdir,
      oid: featureOid,
    })
    expect(newCommit.author.timestamp).toEqual(originalCommit.author.timestamp)

    // Committer timestamp should be new (current time)
    expect(newCommit.committer.timestamp).toBeGreaterThanOrEqual(
      beforeTimestamp
    )
    expect(newCommit.committer.timestamp).toBeLessThanOrEqual(afterTimestamp)
  })

  it('throws MissingNameError when committer not set and user.name missing', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-6')

    await init({ fs, dir, gitdir })

    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }

    // Create base commit and a feature commit (provide explicit author so commits succeed without config)
    await fs._writeFile(join(dir, 'file.txt'), 'base\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'base', author })

    await branch({ fs, dir, gitdir, ref: 'feature' })
    await checkout({ fs, dir, gitdir, ref: 'feature' })
    await fs._writeFile(join(dir, 'feature.txt'), 'feature change\n')
    await add({ fs, dir, gitdir, filepath: 'feature.txt' })
    const featureOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'feature',
      author,
    })

    await checkout({ fs, dir, gitdir, ref: 'master' })
    // Advance master so cherry-pick would create a new commit if it ran
    await fs._writeFile(join(dir, 'master.txt'), 'master update\n')
    await add({ fs, dir, gitdir, filepath: 'master.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'master update', author })

    let error = null
    try {
      await cherryPick({ fs, dir, gitdir, oid: featureOid })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MissingNameError.code)
  })

  it('rejects cherry-picking a root commit', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-cherry-root')

    await init({ fs, dir, gitdir })
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Tester' })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: 'test@example.com',
    })

    await fs._writeFile(join(dir, 'file.txt'), 'root\n')
    await add({ fs, dir, gitdir, filepath: 'file.txt' })
    const rootOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'root',
    })

    let error = null
    try {
      await cherryPick({ fs, dir, gitdir, oid: rootOid })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.CherryPickRootCommitError.code)
    expect(error.data.oid).toBe(rootOid)
  })
  describe('local changes', () => {
    // Makes `name` and `other` the same file, as on a case-insensitive file
    // system like macOS or Windows use (init sets core.ignorecase, as git does
    // there).
    function caseInsensitive(fs, name, other) {
      for (const method of ['_lstat', '_readFile', '_writeFile', '_unlink']) {
        const original = fs[method]
        fs[method] = (filepath, ...rest) =>
          original(
            filepath.endsWith(`/${name}`)
              ? `${filepath.slice(0, -name.length)}${other}`
              : filepath,
            ...rest
          )
      }
    }

    const author = {
      name: 'Tester',
      email: 'test@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }

    // master: file.txt=base, other.txt=other
    // feature: file.txt=remote, gone.txt deleted, added.txt=added
    async function setup(name) {
      const { fs, dir, gitdir } = await makeFixture(name)
      await init({ fs, dir, gitdir })
      await fs._writeFile(join(dir, 'file.txt'), 'base\n')
      await fs._writeFile(join(dir, 'other.txt'), 'other\n')
      await fs._writeFile(join(dir, 'gone.txt'), 'gone\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })

      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fs._writeFile(join(dir, 'file.txt'), 'remote\n')
      await fs._writeFile(join(dir, 'added.txt'), 'added\n')
      await fs.rm(join(dir, 'gone.txt'))
      await add({ fs, dir, gitdir, filepath: ['file.txt', 'added.txt'] })
      await remove({ fs, dir, gitdir, filepath: 'gone.txt' })
      const featureOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'feature',
        author,
      })

      await checkout({ fs, dir, gitdir, ref: 'master' })
      const headOid = await resolveRef({ fs, gitdir, ref: 'HEAD' })
      return { fs, dir, gitdir, featureOid, headOid }
    }

    async function expectRejected(repo, filepaths, options = {}) {
      const { fs, dir, gitdir, featureOid, headOid } = repo
      let error = null
      try {
        await cherryPick({
          fs,
          dir,
          gitdir,
          oid: featureOid,
          committer: author,
          ...options,
        })
      } catch (e) {
        error = e
      }
      expect(error).not.toBeNull()
      expect(error.code).toBe(Errors.CherryPickLocalChangesError.code)
      expect(error.data.filepaths).toEqual(filepaths)
      expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toBe(headOid)
    }

    it('rejects an unstaged edit to a file the commit changes', async () => {
      const repo = await setup('tmp-cherry-dirty-unstaged')
      const { fs, dir } = repo
      await fs._writeFile(join(dir, 'file.txt'), 'local-dirty\n')

      await expectRejected(repo, ['file.txt'])
      expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toBe('local-dirty\n')
    })

    it('rejects a staged edit to a file the commit changes', async () => {
      const repo = await setup('tmp-cherry-dirty-staged')
      const { fs, dir, gitdir } = repo
      await fs._writeFile(join(dir, 'file.txt'), 'local-staged\n')
      await add({ fs, dir, gitdir, filepath: 'file.txt' })

      await expectRejected(repo, ['file.txt'])
      expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toBe(
        'local-staged\n'
      )
      expect(await status({ fs, dir, gitdir, filepath: 'file.txt' })).toBe(
        'modified'
      )
    })

    it('rejects an untracked file where the commit adds one', async () => {
      const repo = await setup('tmp-cherry-dirty-untracked')
      const { fs, dir } = repo
      await fs._writeFile(join(dir, 'added.txt'), 'untracked\n')

      await expectRejected(repo, ['added.txt'])
      expect(await fs.read(join(dir, 'added.txt'), 'utf8')).toBe('untracked\n')
    })

    it('rejects an untracked file whose name differs only in case', async () => {
      const repo = await setup('tmp-cherry-dirty-case')
      const { fs, dir } = repo
      await fs._writeFile(join(dir, 'ADDED.TXT'), 'untracked\n')
      caseInsensitive(fs, 'added.txt', 'ADDED.TXT')

      await expectRejected(repo, ['ADDED.TXT'])
      expect(await fs.read(join(dir, 'ADDED.TXT'), 'utf8')).toBe('untracked\n')
    })
    it('rejects an edit to a file the commit deletes', async () => {
      const repo = await setup('tmp-cherry-dirty-deleted')
      const { fs, dir } = repo
      await fs._writeFile(join(dir, 'gone.txt'), 'local-dirty\n')

      await expectRejected(repo, ['gone.txt'])
      expect(await fs.read(join(dir, 'gone.txt'), 'utf8')).toBe('local-dirty\n')
    })

    it('also rejects when conflicts would be written to the worktree', async () => {
      const repo = await setup('tmp-cherry-dirty-no-abort')
      const { fs, dir } = repo
      await fs._writeFile(join(dir, 'file.txt'), 'local-dirty\n')

      await expectRejected(repo, ['file.txt'], {
        noUpdateBranch: true,
        abortOnConflict: false,
      })
      expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toBe('local-dirty\n')
    })

    it('keeps local edits to files the commit does not touch', async () => {
      const repo = await setup('tmp-cherry-dirty-unrelated')
      const { fs, dir, gitdir, featureOid } = repo
      await fs._writeFile(join(dir, 'other.txt'), 'local-dirty\n')

      await cherryPick({ fs, dir, gitdir, oid: featureOid, committer: author })

      expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toBe('remote\n')
      expect(await fs.read(join(dir, 'other.txt'), 'utf8')).toBe(
        'local-dirty\n'
      )
      expect(await status({ fs, dir, gitdir, filepath: 'other.txt' })).toBe(
        '*modified'
      )
    })

    it('does not check the worktree when it will not be written', async () => {
      const repo = await setup('tmp-cherry-dirty-no-update')
      const { fs, dir, gitdir, featureOid, headOid } = repo
      await fs._writeFile(join(dir, 'file.txt'), 'local-dirty\n')

      const newOid = await cherryPick({
        fs,
        dir,
        gitdir,
        oid: featureOid,
        committer: author,
        noUpdateBranch: true,
      })

      expect(newOid).toBeDefined()
      expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toBe(headOid)
      expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toBe('local-dirty\n')
    })
    it('writes a clean pick the way git does', async () => {
      const { fs, dir, gitdir } = await makeFixture('tmp-cherry-clean-write')
      await init({ fs, dir, gitdir })
      await fs.write(join(dir, 'mod.txt'), 'short\n')
      await fs.write(join(dir, 'gone.txt'), 'gone\n')
      await fs.write(join(dir, 'mode.sh'), 'run\n')
      await fs.write(join(dir, 'sub/x.txt'), 'x\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })
      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fs.write(join(dir, 'mod.txt'), 'much longer content\n')
      await remove({ fs, dir, gitdir, filepath: 'gone.txt' })
      await fs.rm(join(dir, 'gone.txt'))
      await fs.rm(join(dir, 'mode.sh'))
      await fs.write(join(dir, 'mode.sh'), 'run\n', { mode: 0o777 })
      await fs.write(join(dir, 'new.sh'), 'new\n', { mode: 0o777 })
      await remove({ fs, dir, gitdir, filepath: 'sub/x.txt' })
      await fs.rm(join(dir, 'sub/x.txt'))
      await add({ fs, dir, gitdir, filepath: '.' })
      const oid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'feature',
        author,
      })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(join(dir, 'other.txt'), 'other\n')
      await add({ fs, dir, gitdir, filepath: 'other.txt' })
      await gitCommit({ fs, dir, gitdir, message: 'master', author })
      // Only master changed other.txt, so the pick must not write it.
      await fs.write(join(dir, 'other.txt'), 'local edit\n')

      await cherryPick({ fs, dir, gitdir, oid, committer: author })

      expect(await fs.read(join(dir, 'mod.txt'), 'utf8')).toBe(
        'much longer content\n'
      )
      expect(await fs.read(join(dir, 'other.txt'), 'utf8')).toBe('local edit\n')
      expect(await fs.exists(join(dir, 'gone.txt'))).toBe(false)
      expect(await fs.exists(join(dir, 'sub'))).toBe(false)
      const entries = await GitIndexManager.acquire(
        { fs, gitdir, cache: {} },
        async index => index.entriesMap
      )
      expect([...entries.keys()].sort()).toEqual([
        'mod.txt',
        'mode.sh',
        'new.sh',
        'other.txt',
      ])
      expect(entries.get('mode.sh').mode).toBe(0o100755)
      expect(entries.get('new.sh').mode).toBe(0o100755)
      // The recorded size is the new file's, so git does not see it as changed.
      expect(entries.get('mod.txt').size).toBe('much longer content\n'.length)
    })
    it('only overwrites a file that a plain rule ignores', async () => {
      const author = {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      }
      // The `ignore` package and git can disagree on negations, character
      // classes and inner `**`, so with such rules nothing is overwritten.
      for (const [name, ignore, expendable] of [
        ['glob', '*.lock\n', true],
        ['dir', '.local/\n', true],
        ['negation', '.local\n!.local/keep\n', false],
        ['class', '.loc[a]l\n', false],
        ['globstar', '.local\nlogs/**/debug\n', false],
      ]) {
        const { fs, dir, gitdir } = await makeFixture(
          `tmp-cherry-ignored-${name}`
        )
        await init({ fs, dir, gitdir })
        await fs.write(join(dir, '.gitignore'), ignore)
        await fs.write(join(dir, 'f.txt'), 'f\n')
        await add({ fs, dir, gitdir, filepath: '.' })
        await gitCommit({ fs, dir, gitdir, message: 'base', author })
        await branch({ fs, dir, gitdir, ref: 'other', checkout: true })
        await fs.write(join(dir, '.local/folder.lock'), 'theirs\n')
        await add({
          fs,
          dir,
          gitdir,
          filepath: '.local/folder.lock',
          force: true,
        })
        const oid = await gitCommit({
          fs,
          dir,
          gitdir,
          message: 'other',
          author,
        })
        await checkout({ fs, dir, gitdir, ref: 'master' })
        await fs.write(join(dir, '.local/folder.lock'), 'mine\n')

        let error = null
        try {
          await cherryPick({ fs, dir, gitdir, oid, committer: author })
        } catch (e) {
          error = e
        }
        if (expendable) {
          expect(error).toBeNull()
          expect(await fs.read(join(dir, '.local/folder.lock'), 'utf8')).toBe(
            'theirs\n'
          )
        } else {
          expect(error && error.code).toBe(
            Errors.CherryPickLocalChangesError.code
          )
          expect(error.data.filepaths).toEqual(['.local/folder.lock'])
          expect(await fs.read(join(dir, '.local/folder.lock'), 'utf8')).toBe(
            'mine\n'
          )
        }
      }
    })
    it('overwrites an untracked file that .gitignore ignores, like git', async () => {
      for (const conflict of [false, true]) {
        const { fs, dir, gitdir } = await makeFixture(
          `tmp-cherry-ignored-${conflict}`
        )
        await init({ fs, dir, gitdir })
        await fs.write(join(dir, '.gitignore'), '.local\n')
        await fs.write(join(dir, 'f.txt'), 'one\ntwo\nthree\n')
        await add({ fs, dir, gitdir, filepath: '.' })
        await gitCommit({ fs, dir, gitdir, message: 'base', author })
        await branch({ fs, dir, gitdir, ref: 'other', checkout: true })
        await fs.write(join(dir, '.local/folder.lock'), 'theirs\n')
        await add({
          fs,
          dir,
          gitdir,
          filepath: '.local/folder.lock',
          force: true,
        })
        if (conflict) {
          await fs.write(join(dir, 'f.txt'), 'one\nother\nthree\n')
          await add({ fs, dir, gitdir, filepath: 'f.txt' })
        }
        const oid = await gitCommit({
          fs,
          dir,
          gitdir,
          message: 'other',
          author,
        })
        await checkout({ fs, dir, gitdir, ref: 'master' })
        if (conflict) {
          await fs.write(join(dir, 'f.txt'), 'one\nmaster\nthree\n')
          await add({ fs, dir, gitdir, filepath: 'f.txt' })
          await gitCommit({
            fs,
            dir,
            gitdir,
            message: 'master',
            author,
          })
        }
        await fs.write(join(dir, '.local/folder.lock'), 'mine\n')

        let error = null
        try {
          await cherryPick({
            fs,
            dir,
            gitdir,
            oid,
            committer: author,
            abortOnConflict: false,
          })
        } catch (e) {
          error = e
        }
        if (conflict) {
          expect(error && error.code).toBe(Errors.MergeConflictError.code)
        } else {
          expect(error).toBeNull()
        }
        expect(await fs.read(join(dir, '.local/folder.lock'), 'utf8')).toBe(
          'theirs\n'
        )
        expect(
          await status({ fs, dir, gitdir, filepath: '.local/folder.lock' })
        ).toBe(conflict ? 'added' : 'unmodified')
      }
    })
    it('rejects a staged change to a file the commit does not touch', async () => {
      const repo = await setup('tmp-cherry-dirty-staged-other')
      const { fs, dir, gitdir } = repo
      await fs._writeFile(join(dir, 'other.txt'), 'local-staged\n')
      await add({ fs, dir, gitdir, filepath: 'other.txt' })

      await expectRejected(repo, ['other.txt'])
      expect(await status({ fs, dir, gitdir, filepath: 'other.txt' })).toBe(
        'modified'
      )
    })
    it('rejects a staged change when the commit changes nothing, like git', async () => {
      const repo = await setup('tmp-cherry-dirty-staged-empty')
      const { fs, dir, gitdir, headOid } = repo
      const emptyOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'empty',
        author,
        parent: [headOid],
        ref: 'refs/heads/empty',
      })
      await fs._writeFile(join(dir, 'other.txt'), 'local-staged\n')
      await add({ fs, dir, gitdir, filepath: 'other.txt' })

      await expectRejected({ ...repo, featureOid: emptyOid }, ['other.txt'])
      expect(await status({ fs, dir, gitdir, filepath: 'other.txt' })).toBe(
        'modified'
      )
    })
    it('writes conflicts without touching other local changes', async () => {
      const repo = await setup('tmp-cherry-dirty-conflict-write')
      const { fs, dir, gitdir, featureOid } = repo
      await fs._writeFile(join(dir, 'file.txt'), 'master-change\n')
      await add({ fs, dir, gitdir, filepath: 'file.txt' })
      await gitCommit({ fs, dir, gitdir, message: 'master change', author })
      await fs._writeFile(join(dir, 'other.txt'), 'local-dirty\n')
      await fs._writeFile(join(dir, 'untracked.txt'), 'untracked\n')

      let error = null
      try {
        await cherryPick({
          fs,
          dir,
          gitdir,
          oid: featureOid,
          committer: author,
          abortOnConflict: false,
        })
      } catch (e) {
        error = e
      }
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toContain('<<<<<<<')
      expect(await fs.read(join(dir, 'other.txt'), 'utf8')).toBe(
        'local-dirty\n'
      )
      expect(await fs.read(join(dir, 'untracked.txt'), 'utf8')).toBe(
        'untracked\n'
      )
      // The rest of the pick is staged, like git does.
      expect(await status({ fs, dir, gitdir, filepath: 'added.txt' })).toBe(
        'added'
      )
      expect(await status({ fs, dir, gitdir, filepath: 'gone.txt' })).toBe(
        'deleted'
      )
    })
    it('rejects an edit to a file of ours where theirs has a folder', async () => {
      const { fs, dir, gitdir } = await makeFixture(
        'tmp-cherry-dirty-file-vs-dir'
      )
      await init({ fs, dir, gitdir })
      await fs._writeFile(join(dir, 'f.txt'), 'f\n')
      await fs.write(join(dir, 'd/x'), 'base\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author })
      await branch({ fs, dir, gitdir, ref: 'feature', checkout: true })
      await fs.write(join(dir, 'd/x'), 'feature\n')
      await add({ fs, dir, gitdir, filepath: 'd/x' })
      const oid = await gitCommit({ fs, dir, gitdir, message: 'edit', author })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      // ours turns the folder d into a file, which the pick moves aside.
      await remove({ fs, dir, gitdir, filepath: 'd/x' })
      await fs.rm(join(dir, 'd/x'))
      await fs.rmdir(join(dir, 'd'))
      await fs.write(join(dir, 'd'), 'ours file\n')
      await add({ fs, dir, gitdir, filepath: 'd' })
      const headOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'd is a file',
        author,
      })
      await fs.write(join(dir, 'd'), 'ours file\nlocal edit\n')

      await expectRejected({ fs, dir, gitdir, featureOid: oid, headOid }, ['d'])
      expect(await fs.read(join(dir, 'd'), 'utf8')).toBe(
        'ours file\nlocal edit\n'
      )
    })
    it('rejects an untracked file where a version moves aside, like git', async () => {
      const { fs, dir, gitdir } = await makeFixture(
        'tmp-cherry-aside-untracked'
      )
      await init({ fs, dir, gitdir })
      await fs.write(join(dir, 'd/x'), 'base\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      const baseOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'base',
        author,
      })
      // The picked commit turns the folder d into a file, while ours edits
      // d/x: the file has to go to `d~<commit>`.
      const oid = await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'refs/heads/feature',
        parent: [baseOid],
        tree: await writeTree({
          fs,
          gitdir,
          tree: [
            {
              path: 'd',
              mode: '100644',
              type: 'blob',
              oid: await writeBlob({ fs, gitdir, blob: Buffer.from('file\n') }),
            },
          ],
        }),
        message: 'd is a file',
        author,
      })
      await fs.write(join(dir, 'd/x'), 'ours\n')
      await add({ fs, dir, gitdir, filepath: 'd/x' })
      const headOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'ours',
        author,
      })
      const aside = `d~${oid.slice(0, 7)} (d is a file)`
      await fs.write(join(dir, aside), 'precious\n')

      await expectRejected(
        { fs, dir, gitdir, featureOid: oid, headOid },
        [aside],
        { abortOnConflict: false }
      )
      expect(await fs.read(join(dir, aside), 'utf8')).toBe('precious\n')
      expect(await fs.read(join(dir, 'd/x'), 'utf8')).toBe('ours\n')
    })
    it('rejects an ignored file renamed in case from a tracked one', async () => {
      const repo = await setup('tmp-cherry-dirty-case-ignored')
      const { fs, dir } = repo
      await fs.rm(join(dir, 'file.txt'))
      await fs._writeFile(join(dir, 'FILE.TXT'), 'local edit\n')
      await fs._writeFile(join(dir, '.gitignore'), 'FILE.TXT\n')
      caseInsensitive(fs, 'file.txt', 'FILE.TXT')

      await expectRejected(repo, ['FILE.TXT'])
      expect(await fs.read(join(dir, 'FILE.TXT'), 'utf8')).toBe('local edit\n')
    })
    it('rejects a folder in the way when nothing was checked out', async () => {
      const { fs, dir, gitdir } = await makeFixture(
        'tmp-cherry-empty-index-dir'
      )
      await init({ fs, dir, gitdir })
      await fs.write(join(dir, 'd/x'), 'base\n')
      await add({ fs, dir, gitdir, filepath: '.' })
      const headOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'base',
        author,
      })
      // The picked commit turns the folder d into a file.
      const oid = await gitCommit({
        fs,
        dir,
        gitdir,
        ref: 'refs/heads/feature',
        parent: [headOid],
        tree: await writeTree({
          fs,
          gitdir,
          tree: [
            {
              path: 'd',
              mode: '100644',
              type: 'blob',
              oid: await writeBlob({ fs, gitdir, blob: Buffer.from('file\n') }),
            },
          ],
        }),
        message: 'd is a file',
        author,
      })
      await fs.rm(join(gitdir, 'index'))

      await expectRejected({ fs, dir, gitdir, featureOid: oid, headOid }, ['d'])
      expect(await fs.read(join(dir, 'd/x'), 'utf8')).toBe('base\n')
    })
    it('does not check the worktree on a dry run', async () => {
      const repo = await setup('tmp-cherry-dirty-dry-run')
      const { fs, dir, gitdir, featureOid, headOid } = repo
      await fs._writeFile(join(dir, 'file.txt'), 'local-dirty\n')

      for (const abortOnConflict of [true, false]) {
        const newOid = await cherryPick({
          fs,
          dir,
          gitdir,
          oid: featureOid,
          committer: author,
          dryRun: true,
          abortOnConflict,
        })
        expect(newOid).toBeDefined()
      }
      expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toBe(headOid)
      expect(await fs.read(join(dir, 'file.txt'), 'utf8')).toBe('local-dirty\n')
    })
    it('checks every file when the working tree was never checked out', async () => {
      const repo = await setup('tmp-cherry-dirty-empty-index')
      const { fs, dir, gitdir } = repo
      await fs.rm(join(gitdir, 'index'))
      // The whole commit is written, so other.txt is in the way too.
      await fs._writeFile(join(dir, 'other.txt'), 'not checked out\n')

      await expectRejected(repo, ['other.txt'])
      expect(await fs.read(join(dir, 'other.txt'), 'utf8')).toBe(
        'not checked out\n'
      )
    })
    it('writes the whole commit when the working tree was never checked out', async () => {
      const repo = await setup('tmp-cherry-empty-index')
      const { fs, dir, gitdir, featureOid } = repo
      await fs.rm(join(gitdir, 'index'))

      await cherryPick({ fs, dir, gitdir, oid: featureOid, committer: author })

      // gone.txt was never checked out, so it is left as an untracked file.
      expect(await statusMatrix({ fs, dir, gitdir })).toEqual([
        ['added.txt', 1, 1, 1],
        ['file.txt', 1, 1, 1],
        ['gone.txt', 0, 2, 0],
        ['other.txt', 1, 1, 1],
      ])
    })
  })
})
