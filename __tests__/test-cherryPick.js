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
  setConfig,
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

    // Workdir should contain conflict markers
    const content = (await fs.read(join(dir, 'file.txt'))).toString()
    expect(content).toMatch(/<{7,}/) // '<<<<<<<' exists

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
})
