/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// checkout should not write a file whose parent path traverses a symlink. git does not
// follow symlinks in the leading path when writing working-tree files; this checks the
// same. (node-only: needs real symlinks.)
describe('checkout symlinked leading path', () => {
  it('does not write through a planted directory symlink', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-checkout-symlink-leading-path'
    )
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }

    // A directory outside the working tree that the symlink will point at.
    const sink = `${dir}-sink`
    await fsp.mkdir(sink, { recursive: true })

    // Build two commits whose trees contain config/inside (with different
    // content so checkout emits an update op).  We checkout the first commit
    // to populate the workdir and index, then plant the symlink and checkout
    // the second commit.  This replaces the previous git.add() call which
    // crashed on symlinks due to a GitIgnoreManager bug.
    await git.init({ fs, dir, gitdir })
    const blobV1 = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('v1\n'),
    })
    const blobV2 = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('payload\n'),
    })
    const subV1 = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '100644', path: 'inside', oid: blobV1, type: 'blob' }],
    })
    const subV2 = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '100644', path: 'inside', oid: blobV2, type: 'blob' }],
    })
    const rootV1 = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '040000', path: 'config', oid: subV1, type: 'tree' }],
    })
    const rootV2 = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '040000', path: 'config', oid: subV2, type: 'tree' }],
    })
    const commitV1 = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'v1\n',
        tree: rootV1,
        parent: [],
        author,
        committer: author,
      },
    })
    const commitV2 = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'v2\n',
        tree: rootV2,
        parent: [commitV1],
        author,
        committer: author,
      },
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/base',
      value: commitV1,
      force: true,
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/master',
      value: commitV2,
      force: true,
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'HEAD',
      value: 'refs/heads/base',
      symbolic: true,
      force: true,
    })

    // Checkout the first commit to populate the workdir and index.
    await git.checkout({ fs, dir, gitdir, ref: 'base', force: true })

    // Plant `config` as a directory symlink and track it, so checkout sees a
    // symlink -> directory change and reaches the file-write step.
    await fsp.rm(join(dir, 'config'), { recursive: true })
    try {
      await fsp.symlink(sink, join(dir, 'config'))
    } catch (e) {
      // Symlink creation not permitted here (e.g. Windows without privilege).
      return
    }

    let error
    try {
      await git.checkout({ fs, dir, gitdir, ref: 'master', force: true })
    } catch (e) {
      error = e
    }
    expect(error).toBeDefined()
    const inner =
      error && error.errors && error.errors[0] ? error.errors[0] : error
    expect(`${inner.code || inner.name}`).toMatch(/unsafe/i)

    // The file must not have been written through the symlink into the sink.
    await expect(
      fsp.readFile(join(sink, 'inside'), 'utf8')
    ).rejects.toBeDefined()
  })

  it('does not mkdir through a symlinked leading path', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-checkout-symlink-leading-path'
    )
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }

    const sink = `${dir}-sink`
    await fsp.mkdir(sink, { recursive: true })

    await git.init({ fs, dir, gitdir })

    // Commit A: evil/file (creates evil/ as a real directory)
    // Commit B: evil/file + evil/sub/deep (adds a subdirectory)
    // After checking out A, replace evil/ with a symlink to sink/.
    // Checking out B should refuse to mkdir evil/sub through the symlink.
    const blobV1 = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('v1\n'),
    })
    const blobPayload = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('payload\n'),
    })
    const evilTreeA = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '100644', path: 'file', oid: blobV1, type: 'blob' }],
    })
    const subTree = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '100644', path: 'deep', oid: blobPayload, type: 'blob' }],
    })
    const evilTreeB = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [
        { mode: '100644', path: 'file', oid: blobV1, type: 'blob' },
        { mode: '040000', path: 'sub', oid: subTree, type: 'tree' },
      ],
    })
    const rootA = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '040000', path: 'evil', oid: evilTreeA, type: 'tree' }],
    })
    const rootB = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '040000', path: 'evil', oid: evilTreeB, type: 'tree' }],
    })
    const commitA = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'A\n',
        tree: rootA,
        parent: [],
        author,
        committer: author,
      },
    })
    const commitB = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'B\n',
        tree: rootB,
        parent: [commitA],
        author,
        committer: author,
      },
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/base',
      value: commitA,
      force: true,
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/target',
      value: commitB,
      force: true,
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'HEAD',
      value: 'refs/heads/base',
      symbolic: true,
      force: true,
    })

    await git.checkout({ fs, dir, gitdir, ref: 'base', force: true })

    await fsp.rm(join(dir, 'evil'), { recursive: true })
    try {
      await fsp.symlink(sink, join(dir, 'evil'))
    } catch (e) {
      return
    }

    let error
    try {
      await git.checkout({ fs, dir, gitdir, ref: 'target', force: true })
    } catch (e) {
      error = e
    }
    expect(error).toBeDefined()
    const inner =
      error && error.errors && error.errors[0] ? error.errors[0] : error
    expect(`${inner.code || inner.name}`).toMatch(/unsafe/i)

    // The directory must not have been created inside the sink.
    await expect(fsp.stat(join(sink, 'sub'))).rejects.toBeDefined()
  })

  it('does not write through a planted directory symlink (nonBlocking)', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-checkout-symlink-leading-path'
    )
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }

    const sink = `${dir}-sink`
    await fsp.mkdir(sink, { recursive: true })

    // Same scenario as the first test, but using the nonBlocking code path.
    await git.init({ fs, dir, gitdir })
    const blobV1 = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('v1\n'),
    })
    const blobV2 = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('payload\n'),
    })
    const subV1 = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '100644', path: 'inside', oid: blobV1, type: 'blob' }],
    })
    const subV2 = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '100644', path: 'inside', oid: blobV2, type: 'blob' }],
    })
    const rootV1 = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '040000', path: 'config', oid: subV1, type: 'tree' }],
    })
    const rootV2 = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '040000', path: 'config', oid: subV2, type: 'tree' }],
    })
    const commitV1 = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'v1\n',
        tree: rootV1,
        parent: [],
        author,
        committer: author,
      },
    })
    const commitV2 = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'v2\n',
        tree: rootV2,
        parent: [commitV1],
        author,
        committer: author,
      },
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/base',
      value: commitV1,
      force: true,
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/master',
      value: commitV2,
      force: true,
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'HEAD',
      value: 'refs/heads/base',
      symbolic: true,
      force: true,
    })

    await git.checkout({ fs, dir, gitdir, ref: 'base', force: true })

    await fsp.rm(join(dir, 'config'), { recursive: true })
    try {
      await fsp.symlink(sink, join(dir, 'config'))
    } catch (e) {
      return
    }

    let error
    try {
      await git.checkout({
        fs,
        dir,
        gitdir,
        ref: 'master',
        force: true,
        nonBlocking: true,
      })
    } catch (e) {
      error = e
    }
    expect(error).toBeDefined()
    const inner =
      error && error.errors && error.errors[0] ? error.errors[0] : error
    expect(`${inner.code || inner.name}`).toMatch(/unsafe/i)

    await expect(
      fsp.readFile(join(sink, 'inside'), 'utf8')
    ).rejects.toBeDefined()
  })
})
