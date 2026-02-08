/* eslint-env node, browser, jasmine */

import { join } from 'path'

import {
  Errors,
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
  merge as mergeApi,
} from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('cherryPick in submodule', () => {
  it('simple cherry-pick without conflicts', async () => {
    // Setup - create a tiny repository programmatically inside a faux submodule
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    // Create a submodule repo
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub')

    // Place submodule into superproject structure similar to makeFixtureAsSubmodule
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule\n'
    )

    // Now operate inside the submodule
    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Test User',
      email: 'test@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })

    // Create feature branch and commit
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    const featureOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })

    // Switch to master and advance master to ensure new commit differs
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    await fssp._writeFile(
      join(officialSubmoduleDir, 'master.txt'),
      'master update\n'
    )
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'master.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'master update',
      author,
    })
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: featureOid,
    })

    // Verify
    expect(newOid).toBeDefined()
    expect(newOid).not.toBe(featureOid)
    const { commit: newCommit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: newOid,
    })
    expect(newCommit.parent.length).toBe(1)
  })

  it('cherry-pick with dryRun', async () => {
    // Setup - programmatic submodule repo
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub-dry')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule-dry')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule-dry')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule-dry\n'
    )

    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file2.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file2.txt',
    })
    const newestOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })

    const beforeOid = await resolveRef({
      fs: fssp,
      gitdir: submoduleGitFile,
      ref: 'HEAD',
    })
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: newestOid,
      dryRun: true,
    })
    expect(newOid).toBeDefined()
    const afterOid = await resolveRef({
      fs: fssp,
      gitdir: submoduleGitFile,
      ref: 'HEAD',
    })
    expect(afterOid).toEqual(beforeOid)
  })

  it('reject merge commits', async () => {
    // Setup - programmatic submodule repo and create a merge commit
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub-merge')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule-merge')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule-merge')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule-merge\n'
    )
    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })
    // create branch a
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'a',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'a',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'a.txt'), 'a\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'a.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'a',
      author,
    })
    // create branch b
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'b',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'b',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'b.txt'), 'b\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'b.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'b',
      author,
    })
    // Merge a into b
    await mergeApi({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      theirs: 'a',
      author,
    })
    const commits = await log({ fs: fssp, gitdir: submoduleGitFile, ref: 'b' })
    const mergeCommit = commits.find(c => c.commit.parent.length > 1)
    expect(mergeCommit).toBeDefined()
    if (!mergeCommit) throw new Error('Expected a merge commit')
    let error = null
    try {
      await cherryPick({
        fs: fssp,
        dir: officialSubmoduleDir,
        gitdir: submoduleGitFile,
        oid: mergeCommit.oid,
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.CherryPickMergeCommitError.code)
    expect(error.data.parentCount).toBe(mergeCommit.commit.parent.length)
  })

  it('cherry-pick with custom committer', async () => {
    // Setup - programmatic submodule repo
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub2')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule2')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule2')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule2\n'
    )

    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })

    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file2.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file2.txt',
    })
    const featureOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })

    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    const customCommitter = {
      name: 'Cherry Picker',
      email: 'picker@example.com',
      timestamp: 1234567890,
      timezoneOffset: -120,
    }
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: featureOid,
      committer: customCommitter,
    })
    const { commit: newCommit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: newOid,
    })
    expect(newCommit.committer.name).toEqual(customCommitter.name)
    expect(newCommit.committer.email).toEqual(customCommitter.email)
  })

  it('noUpdateBranch option', async () => {
    // Setup - programmatic submodule repo
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub3')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule3')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule3')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule3\n'
    )
    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file2.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file2.txt',
    })
    const featureOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    const beforeOid = await resolveRef({
      fs: fssp,
      gitdir: submoduleGitFile,
      ref: 'HEAD',
    })
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: featureOid,
      noUpdateBranch: true,
    })
    expect(newOid).toBeDefined()
    const afterOid = await resolveRef({
      fs: fssp,
      gitdir: submoduleGitFile,
      ref: 'HEAD',
    })
    expect(afterOid).toEqual(beforeOid)
    const { commit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: newOid,
    })
    expect(commit).toBeDefined()
  })

  it('cherry-pick creates new committer timestamp', async () => {
    // Setup - programmatic submodule repo
    const { fs: fssp, dir: dirsp } = await makeFixture('superproject-test')
    const { dir, gitdir } = await makeFixture('tmp-cherry-sub4')
    await fssp._mkdir(join(dirsp, '.git'))
    await fssp._mkdir(join(dirsp, '.git', 'modules'))
    const gitdirsmfullpath = join(dirsp, '.git', 'modules', 'mysubmodule4')
    await fssp._cp(gitdir, gitdirsmfullpath, { recursive: true })
    const officialSubmoduleDir = join(dirsp, 'mysubmodule4')
    await fssp._cp(dir, officialSubmoduleDir, { recursive: true })
    const submoduleGitFile = join(officialSubmoduleDir, '.git')
    await fssp._writeFile(
      submoduleGitFile,
      'gitdir: ../.git/modules/mysubmodule4\n'
    )
    await init({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
    })
    const author = {
      name: 'Author',
      email: 'author@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fssp._writeFile(join(officialSubmoduleDir, 'file.txt'), 'base\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file.txt',
    })
    await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'base',
      author,
    })
    await branch({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'feature',
    })
    await fssp._writeFile(join(officialSubmoduleDir, 'file2.txt'), 'feature\n')
    await add({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      filepath: 'file2.txt',
    })
    const featureOid = await gitCommit({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      message: 'feature',
      author,
    })
    await checkout({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      ref: 'master',
    })
    const beforeTimestamp = Math.floor(Date.now() / 1000)
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.name',
      value: 'Committer',
    })
    await setConfig({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      path: 'user.email',
      value: 'committer@example.com',
    })
    const newOid = await cherryPick({
      fs: fssp,
      dir: officialSubmoduleDir,
      gitdir: submoduleGitFile,
      oid: featureOid,
    })
    const afterTimestamp = Math.floor(Date.now() / 1000)
    const { commit: newCommit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: newOid,
    })
    const { commit: originalCommit } = await readCommit({
      fs: fssp,
      gitdir: submoduleGitFile,
      oid: featureOid,
    })
    expect(newCommit.author.timestamp).toEqual(originalCommit.author.timestamp)
    expect(newCommit.committer.timestamp).toBeGreaterThanOrEqual(
      beforeTimestamp
    )
    expect(newCommit.committer.timestamp).toBeLessThanOrEqual(afterTimestamp)
  })
})
