/* eslint-env node, browser, jasmine */
import * as path from 'path'

import {
  Errors,
  readCommit,
  commit,
  log,
  resolveRef,
  init,
  add,
  annotatedTag,
  writeTag,
  status,
  statusMatrix,
  setConfig,
} from 'isomorphic-git'

import { makeFixtureAsSubmodule } from './__helpers__/FixtureFSSubmodule.js'

describe('commit', () => {
  it('prevent commit if index has unmerged paths', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule(
      'test-GitIndex-unmerged'
    )
    // Test
    let error = null
    try {
      await commit({
        fs,
        gitdir,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
        message: 'Initial commit',
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.UnmergedPathsError.code)
  })
  it('commit', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    const sha = await commit({
      fs,
      gitdir,
      author,
      message: 'Initial commit',
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // updates branch pointer
    const { oid: currentOid, commit: currentCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]
    expect(currentCommit.parent).toEqual([originalOid])
    expect(currentCommit.author).toEqual(author)
    expect(currentCommit.committer).toEqual(author)
    expect(currentCommit.message).toEqual('Initial commit\n')
    expect(currentOid).not.toEqual(originalOid)
    expect(currentOid).toEqual(sha)
  })

  it('Initial commit', async () => {
    // Setup
    const { fs, dir } = await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir })
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    await add({ fs, dir, filepath: 'hello.md' })

    // Test
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    await commit({
      fs,
      dir,
      author,
      message: 'Initial commit',
    })

    const commits = await log({ fs, dir })
    expect(commits.length).toBe(1)
    expect(commits[0].commit.parent).toEqual([])
    expect(await resolveRef({ fs, dir, ref: 'HEAD' })).toEqual(commits[0].oid)
  })

  it('Cannot commit without message', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    // Test
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    let error = null

    try {
      await commit({
        fs,
        gitdir,
        author,
      })
    } catch (err) {
      error = err
    }

    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })

  it('without updating branch', async () => {
    // Setup
    const { fs, gitdir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Initial commit',
      noUpdateBranch: true,
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update branch pointer
    const { oid: currentOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    expect(currentOid).toEqual(originalOid)
    expect(currentOid).not.toEqual(sha)
    // but DID create commit object
    expect(
      await fs.exists(
        `${gitdirsmfullpath}/objects/7a/51c0b1181d738198ff21c4679d3aa32eb52fe0`
      )
    ).toBe(true)
  })

  it('dry run', async () => {
    // Setup
    const { fs, gitdir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Initial commit',
      dryRun: true,
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update branch pointer
    const { oid: currentOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    expect(currentOid).toEqual(originalOid)
    expect(currentOid).not.toEqual(sha)
    // and did NOT create commit object
    expect(
      await fs.exists(
        `${gitdirsmfullpath}/objects/7a/51c0b1181d738198ff21c4679d3aa32eb52fe0`
      )
    ).toBe(false)
  })

  it('custom ref', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Initial commit',
      ref: 'refs/heads/master-copy',
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update master branch pointer
    const { oid: currentOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    expect(currentOid).toEqual(originalOid)
    expect(currentOid).not.toEqual(sha)
    // but DOES update master-copy
    const { oid: copyOid } = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'master-copy',
      })
    )[0]
    expect(sha).toEqual(copyOid)
  })

  it('custom parents and tree', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const parent = [
      '1111111111111111111111111111111111111111',
      '2222222222222222222222222222222222222222',
      '3333333333333333333333333333333333333333',
    ]
    const tree = '4444444444444444444444444444444444444444'
    const sha = await commit({
      fs,
      gitdir,
      parent,
      tree,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Initial commit',
    })
    expect(sha).toBe('43fbc94f2c1db655a833e08c72d005954ff32f32')
    // does NOT update master branch pointer
    const { parent: parents, tree: _tree } = (
      await log({
        fs,
        gitdir,
        depth: 1,
      })
    )[0].commit
    expect(parents).not.toEqual([originalOid])
    expect(parents).toEqual(parent)
    expect(_tree).toEqual(tree)
  })

  it('custom parent given as an annotated tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    await annotatedTag({
      fs,
      gitdir,
      ref: 'parent-tag',
      object: originalOid,
      message: 'annotated tag',
      tagger: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    // Test
    const sha = await commit({
      fs,
      gitdir,
      parent: ['parent-tag'],
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Commit on top of a tag',
    })
    // the parent should be the commit, not the tag object
    const { commit: c } = await readCommit({ fs, gitdir, oid: sha })
    expect(c.parent).toEqual([originalOid])
  })

  it('custom parent given as an annotated tag oid', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    await annotatedTag({
      fs,
      gitdir,
      ref: 'parent-tag',
      object: originalOid,
      message: 'annotated tag',
      tagger: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    const tagOid = await resolveRef({ fs, gitdir, ref: 'parent-tag' })
    // Test
    const sha = await commit({
      fs,
      gitdir,
      parent: [tagOid],
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Commit on top of a tag',
    })
    // the parent should be the commit, not the tag object
    const { commit: c } = await readCommit({ fs, gitdir, oid: sha })
    expect(c.parent).toEqual([originalOid])
  })

  it('custom parent given as an annotated tag of a missing commit', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    const missingOid = '1111111111111111111111111111111111111111'
    const tagOid = await writeTag({
      fs,
      gitdir,
      tag: {
        object: missingOid,
        type: 'commit',
        tag: 'missing-tag',
        tagger: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
        message: 'annotated tag of a missing commit',
      },
    })
    // Test
    const sha = await commit({
      fs,
      gitdir,
      parent: [tagOid],
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Commit on top of a tag of a missing commit',
    })
    // the parent should be the missing commit, not the tag object
    const { commit: c } = await readCommit({ fs, gitdir, oid: sha })
    expect(c.parent).toEqual([missingOid])
  })

  it('throw error if missing author', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    // Test
    let error = null
    try {
      await commit({
        fs,
        gitdir,
        author: {
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: 0,
        },
        message: 'Initial commit',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MissingNameError.code)
  })

  it('create signed commit', async () => {
    // Setup
    const { pgp } = await import('@isomorphic-git/pgp-plugin')
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    // Test
    const { privateKey, publicKey } = await import('./__fixtures__/pgp-keys.js')
    const oid = await commit({
      fs,
      gitdir,
      message: 'Initial commit',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1504842425,
        timezoneOffset: 0,
      },
      signingKey: privateKey,
      onSign: pgp.sign,
    })
    const { commit: commitObject, payload } = await readCommit({
      fs,
      gitdir,
      oid,
    })
    const { valid, invalid } = await pgp.verify({
      payload,
      publicKey,
      signature: commitObject.gpgsig,
    })
    expect(invalid).toEqual([])
    expect(valid).toEqual(['f2f0ced8a52613c4'])
  })

  it('with timezone', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    let commits
    // Test
    await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: '-0 offset',
    })
    commits = await log({ fs, gitdir, depth: 1 })
    expect(Object.is(commits[0].commit.author.timezoneOffset, -0)).toBeTruthy()

    await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: 0,
      },
      message: '+0 offset',
    })
    commits = await log({ fs, gitdir, depth: 1 })
    expect(Object.is(commits[0].commit.author.timezoneOffset, 0)).toBeTruthy()

    await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: 240,
      },
      message: '+240 offset',
    })
    commits = await log({ fs, gitdir, depth: 1 })
    expect(Object.is(commits[0].commit.author.timezoneOffset, 240)).toBeTruthy()

    await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -240,
      },
      message: '-240 offset',
    })
    commits = await log({ fs, gitdir, depth: 1 })
    expect(
      Object.is(commits[0].commit.author.timezoneOffset, -240)
    ).toBeTruthy()
  })

  it('commit amend (new message)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    await commit({
      fs,
      gitdir,
      author,
      message: 'Initial commit',
    })

    // Test
    const { oid: originalOid, commit: originalCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]
    await commit({
      fs,
      gitdir,
      message: 'Amended commit',
      amend: true,
    })
    const { oid: amendedOid, commit: amendedCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]

    expect(amendedOid).not.toEqual(originalOid)
    expect(amendedCommit.author).toEqual(originalCommit.author)
    expect(amendedCommit.committer).toEqual(originalCommit.committer)
    expect(amendedCommit.message).toEqual('Amended commit\n')
    expect(amendedCommit.parent).toEqual(originalCommit.parent)
    expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toEqual(amendedOid)
  })

  it('commit amend (change author, keep message)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-commit')
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    await commit({
      fs,
      gitdir,
      author,
      message: 'Initial commit',
    })

    // Test
    const { oid: originalOid, commit: originalCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]

    const newAuthor = {
      name: 'Mr. Test 2',
      email: 'mrtest2@example.com',
      timestamp: 1262356921,
      timezoneOffset: -0,
    }
    await commit({
      fs,
      gitdir,
      author: newAuthor,
      amend: true,
    })
    const { oid: amendedOid, commit: amendedCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]

    expect(amendedOid).not.toEqual(originalOid)
    expect(amendedCommit.author).toEqual(newAuthor)
    expect(amendedCommit.committer).toEqual(newAuthor)
    expect(amendedCommit.message).toEqual(originalCommit.message)
    expect(amendedCommit.parent).toEqual(originalCommit.parent)
    expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toEqual(amendedOid)
  })

  it('Cannot amend without an initial commit', async () => {
    // Setup
    const { fs, dir } = await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir })
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    await add({ fs, dir, filepath: 'hello.md' })

    // Test
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    let error = null
    try {
      await commit({
        fs,
        dir,
        author,
        message: 'Initial commit',
        amend: true,
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.NoCommitError).toBe(true)
  })

  it('leaves intent-to-add entries out of the tree', async () => {
    // Setup: `b.txt` was added with `git add -N`
    const { fs, gitdir } = await makeFixtureAsSubmodule('test-GitIndex-v3')
    const { commit: parentCommit } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Second commit',
    })
    const { commit: newCommit } = await readCommit({ fs, gitdir, oid: sha })
    expect(newCommit.tree).toBe(parentCommit.tree)
  })

  it('leaves intent-to-add entries out of the tree after status refreshes their stats', async () => {
    // Setup: `b.txt` was added with `git add -N` and is still empty
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-GitIndex-v3')
    const { commit: parentCommit } = (await log({ fs, gitdir, depth: 1 }))[0]
    await fs.write(path.join(dir, 'b.txt'), '')
    // Test
    await status({ fs, dir, gitdir, filepath: 'b.txt' })
    const sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Second commit',
    })
    const { commit: newCommit } = await readCommit({ fs, gitdir, oid: sha })
    expect(newCommit.tree).toBe(parentCommit.tree)
  })

  it('leaves intent-to-add entries out of the tree after statusMatrix refreshes their stats', async () => {
    // Setup: `b.txt` was added with `git add -N` and is still empty
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-GitIndex-v3')
    const { commit: parentCommit } = (await log({ fs, gitdir, depth: 1 }))[0]
    await fs.write(path.join(dir, 'b.txt'), '')
    // Test
    await statusMatrix({ fs, dir, gitdir })
    const sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Second commit',
    })
    const { commit: newCommit } = await readCommit({ fs, gitdir, oid: sha })
    expect(newCommit.tree).toBe(parentCommit.tree)
  })

  it('finishes a merge recorded in MERGE_HEAD and MERGE_MSG', async () => {
    const { fs, dir, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'tmp-commit-merge-head'
    )
    await init({ fs, dir, gitdir })
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: 0,
    }
    await fs.write(`${dir}/a.txt`, 'a')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    const first = await commit({ fs, dir, gitdir, message: 'first', author })
    const other = await commit({
      fs,
      dir,
      gitdir,
      message: 'other',
      author,
      parent: [],
      ref: 'refs/heads/other',
    })
    await fs.write(`${gitdirsmfullpath}/MERGE_HEAD`, `${other}\n`)
    await fs.write(
      `${gitdirsmfullpath}/MERGE_MSG`,
      'Merge it\n\n# Conflicts:\n#\ta.txt\n'
    )

    // A commit on another branch leaves the merge alone.
    let error = null
    try {
      await commit({ fs, dir, gitdir, author, ref: 'refs/heads/other' })
    } catch (e) {
      error = e
    }
    expect(error.code).toBe(Errors.MissingParameterError.code)

    const oid = await commit({ fs, dir, gitdir, author })
    const { commit: merged } = await readCommit({ fs, gitdir, oid })
    expect(merged.parent).toEqual([first, other])
    expect(merged.message).toBe('Merge it\n')
    expect(await resolveRef({ fs, gitdir, ref: 'master' })).toBe(oid)
    expect(await fs.exists(`${gitdirsmfullpath}/MERGE_HEAD`)).toBe(false)
    expect(await fs.exists(`${gitdirsmfullpath}/MERGE_MSG`)).toBe(false)
  })

  it('finishes a cherry-pick recorded in CHERRY_PICK_HEAD and MERGE_MSG', async () => {
    const { fs, dir, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'tmp-commit-cherry-pick-head'
    )
    await init({ fs, dir, gitdir })
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Committer' })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: 'committer@example.com',
    })
    const original = {
      name: 'Original Author',
      email: 'original@example.com',
      timestamp: 1600000000,
      timezoneOffset: 0,
    }
    await fs.write(`${dir}/a.txt`, 'a')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    const first = await commit({
      fs,
      dir,
      gitdir,
      message: 'first',
      author: original,
    })
    const message = 'picked subject\n\nbody\n'
    const picked = await commit({
      fs,
      dir,
      gitdir,
      message,
      author: original,
      parent: [first],
      ref: 'refs/heads/picked',
    })
    await fs.write(`${gitdirsmfullpath}/CHERRY_PICK_HEAD`, `${picked}\n`)
    await fs.write(
      `${gitdirsmfullpath}/MERGE_MSG`,
      `${message}\n# Conflicts:\n#\ta.txt\n`
    )
    await fs.write(`${dir}/a.txt`, 'resolved')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })

    // Like `git commit`: the picked author and message, the current committer.
    const oid = await commit({ fs, dir, gitdir })
    const { commit: made } = await readCommit({ fs, gitdir, oid })
    expect(made.message).toBe(message)
    expect(made.author).toEqual(original)
    expect(made.committer.name).toBe('Committer')
    expect(made.committer.email).toBe('committer@example.com')
    expect(made.committer.timestamp).not.toBe(original.timestamp)
    expect(await fs.exists(`${gitdirsmfullpath}/CHERRY_PICK_HEAD`)).toBe(false)
    expect(await fs.exists(`${gitdirsmfullpath}/MERGE_MSG`)).toBe(false)
  })
  // master has "first"; other is an unrelated commit to merge.
  async function mergeRepo(name) {
    const { fs, dir, gitdir, gitdirsmfullpath } =
      await makeFixtureAsSubmodule(name)
    await init({ fs, dir, gitdir })
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: 0,
    }
    await fs.write(`${dir}/a.txt`, 'a')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    const first = await commit({ fs, dir, gitdir, message: 'first', author })
    const other = await commit({
      fs,
      dir,
      gitdir,
      message: 'other',
      author,
      parent: [],
      ref: 'refs/heads/other',
    })
    return {
      fs,
      dir,
      gitdir,
      realGitdir: gitdirsmfullpath,
      author,
      first,
      other,
    }
  }

  it('takes the message from MERGE_MSG the way git commit does', async () => {
    const { fs, dir, gitdir, realGitdir, author, first, other } =
      await mergeRepo('tmp-commit-merge-msg')
    await fs.write(`${realGitdir}/MERGE_HEAD`, `${other}\n`)
    // Comment lines go, and so does surrounding whitespace, as with
    // `git stripspace --strip-comments`.
    await fs.write(
      `${realGitdir}/MERGE_MSG`,
      '\n\nMerge it  \n\n\n#42 looks like a comment\n  indented # kept\nbody\t\n\n\n# Conflicts:\n#\ta.txt\n'
    )
    const oid = await commit({ fs, dir, gitdir, author })
    const { commit: merged } = await readCommit({ fs, gitdir, oid })
    expect(merged.parent).toEqual([first, other])
    expect(merged.message).toBe('Merge it\n\n  indented # kept\nbody\n')

    // Nothing but comments and blank lines: a message is still required.
    await fs.write(`${realGitdir}/MERGE_HEAD`, `${other}\n`)
    await fs.write(`${realGitdir}/MERGE_MSG`, '\n  \n# Conflicts:\n#\ta.txt\n')
    let error = null
    try {
      await commit({ fs, dir, gitdir, author })
    } catch (e) {
      error = e
    }
    expect(error.code).toBe(Errors.MissingParameterError.code)
    expect(await fs.exists(`${realGitdir}/MERGE_HEAD`)).toBe(true)
  })

  it('removes every file git keeps for a merge in progress', async () => {
    const { fs, dir, gitdir, realGitdir, author, other } = await mergeRepo(
      'tmp-commit-merge-state-files'
    )
    await fs.write(`${realGitdir}/MERGE_HEAD`, `${other}\n`)
    // git only trims spaces, tabs and carriage returns, so \v and \f stay.
    await fs.write(`${realGitdir}/MERGE_MSG`, 'Merge it\v\n\f\n')
    // git writes these too.
    await fs.write(`${realGitdir}/MERGE_MODE`, '')
    await fs.write(`${realGitdir}/AUTO_MERGE`, `${other}\n`)

    const oid = await commit({ fs, dir, gitdir, author })
    const { commit: merged } = await readCommit({ fs, gitdir, oid })
    expect(merged.message).toBe('Merge it\v\n\f\n')
    for (const file of [
      'MERGE_HEAD',
      'MERGE_MSG',
      'MERGE_MODE',
      'AUTO_MERGE',
    ]) {
      expect(await fs.exists(`${realGitdir}/${file}`)).toBe(false)
    }
  })

  it('lets a merge in progress win over a cherry-pick for the author, like git', async () => {
    const { fs, dir, gitdir, realGitdir, first, other } = await mergeRepo(
      'tmp-commit-merge-and-pick'
    )
    await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Committer' })
    await setConfig({
      fs,
      dir,
      gitdir,
      path: 'user.email',
      value: 'committer@example.com',
    })
    const picked = await commit({
      fs,
      dir,
      gitdir,
      message: 'picked',
      author: {
        name: 'Picked Author',
        email: 'picked@example.com',
        timestamp: 1600000000,
        timezoneOffset: 0,
      },
      parent: [first],
      ref: 'refs/heads/picked',
    })
    // A cherry-pick that stopped on conflicts while a merge was in progress.
    await fs.write(`${realGitdir}/MERGE_HEAD`, `${other}\n`)
    await fs.write(`${realGitdir}/CHERRY_PICK_HEAD`, `${picked}\n`)
    await fs.write(`${realGitdir}/MERGE_MSG`, 'picked\n')

    const oid = await commit({ fs, dir, gitdir })
    const { commit: made } = await readCommit({ fs, gitdir, oid })
    expect(made.parent).toEqual([first, other])
    expect(made.author.name).toBe('Committer')
    expect(made.author.email).toBe('committer@example.com')
  })

  it('peels an annotated tag in MERGE_HEAD, which git writes as it is', async () => {
    const { fs, dir, gitdir, realGitdir, author, first, other } =
      await mergeRepo('tmp-commit-merge-head-tag')
    await annotatedTag({
      fs,
      dir,
      gitdir,
      ref: 'v1',
      object: other,
      message: 'v1',
      tagger: author,
    })
    const tag = await resolveRef({ fs, gitdir, ref: 'refs/tags/v1' })
    expect(tag).not.toBe(other)
    await fs.write(`${realGitdir}/MERGE_HEAD`, `${tag}\n`)
    await fs.write(`${realGitdir}/MERGE_MSG`, "Merge tag 'v1'\n")

    const oid = await commit({ fs, dir, gitdir, author })
    const { commit: merged } = await readCommit({ fs, gitdir, oid })
    expect(merged.parent).toEqual([first, other])
  })

  it('leaves a merge in progress alone unless it commits on HEAD', async () => {
    const { fs, dir, gitdir, realGitdir, author, first } = await mergeRepo(
      'tmp-commit-merge-head-elsewhere'
    )
    const other = await resolveRef({ fs, gitdir, ref: 'refs/heads/other' })
    await fs.write(`${realGitdir}/MERGE_HEAD`, `${other}\n`)
    await fs.write(`${realGitdir}/MERGE_MSG`, 'Merge it\n')

    for (const options of [
      { ref: 'refs/heads/other' },
      // Not expanded, so not the checked-out branch.
      { ref: 'master' },
      { noUpdateBranch: true },
      { dryRun: true },
    ]) {
      await commit({ fs, dir, gitdir, author, message: 'not it', ...options })
      expect(await fs.exists(`${realGitdir}/MERGE_HEAD`)).toBe(true)
      expect(await fs.exists(`${realGitdir}/MERGE_MSG`)).toBe(true)
    }
    expect(await resolveRef({ fs, gitdir, ref: 'refs/heads/master' })).toBe(
      first
    )
  })

  it('refuses to amend in the middle of a merge or cherry-pick, like git', async () => {
    const { fs, dir, gitdir, realGitdir, author, first } = await mergeRepo(
      'tmp-commit-merge-head-amend'
    )
    for (const file of ['MERGE_HEAD', 'CHERRY_PICK_HEAD']) {
      await fs.write(`${realGitdir}/${file}`, `${first}\n`)
      let error = null
      try {
        await commit({ fs, dir, gitdir, author, amend: true, message: 'x' })
      } catch (e) {
        error = e
      }
      expect(error.code).toBe(Errors.MergeInProgressError.code)
      expect(error.data.file).toBe(file)
      expect(await resolveRef({ fs, gitdir, ref: 'master' })).toBe(first)
      expect(await fs.exists(`${realGitdir}/${file}`)).toBe(true)
      await fs.rm(`${realGitdir}/${file}`)
    }
  })
})
