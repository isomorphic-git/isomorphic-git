/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// cherryPick applies the resulting tree to the working directory via
// applyTreeChanges. It must not write a file (or mkdir) whose parent path
// traverses a symlink, exactly like checkout. Canonical git replaces the
// symlink with a real directory instead of following it; isomorphic-git
// refuses the unsafe write. (node-only: needs real symlinks.)
describe('cherryPick symlinked leading path', () => {
  it('does not write through a tracked directory symlink', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-cherryPick-symlink-leading-path'
    )
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }

    // A directory outside the working tree that the symlink points at.
    const sink = `${dir}-sink`
    await fsp.mkdir(sink, { recursive: true })

    await git.init({ fs, dir, gitdir })

    // Base commit: `link` is a symlink pointing outside the worktree.
    const linkBlob = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from(sink),
    })
    const baseTree = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '120000', path: 'link', oid: linkBlob, type: 'blob' }],
    })
    const baseCommit = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'base\n',
        tree: baseTree,
        parent: [],
        author,
        committer: author,
      },
    })

    // Malicious commit (child of base): `link` becomes a directory containing
    // `link/marker`. Cherry-picking this onto base merges to `link/marker`,
    // whose leading component `link` is a symlink on disk.
    const markerBlob = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('pwned\n'),
    })
    const linkDirTree = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '100644', path: 'marker', oid: markerBlob, type: 'blob' }],
    })
    const evilTree = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '040000', path: 'link', oid: linkDirTree, type: 'tree' }],
    })
    const evilCommit = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'evil\n',
        tree: evilTree,
        parent: [baseCommit],
        author,
        committer: author,
      },
    })

    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/master',
      value: baseCommit,
      force: true,
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'HEAD',
      value: 'refs/heads/master',
      symbolic: true,
      force: true,
    })

    // Checkout base so the `link` symlink exists on disk.
    await git.checkout({ fs, dir, gitdir, ref: 'master', force: true })

    // Sanity: the symlink is really on disk.
    const lst = await fsp.lstat(join(dir, 'link'))
    expect(lst.isSymbolicLink()).toBe(true)

    let error
    try {
      await git.cherryPick({
        fs,
        dir,
        gitdir,
        oid: evilCommit,
        committer: author,
      })
    } catch (e) {
      error = e
    }
    expect(error).toBeDefined()
    const inner =
      error && error.errors && error.errors[0] ? error.errors[0] : error
    expect(`${inner.code || inner.name}`).toMatch(/unsafe/i)

    // The marker must not have been written through the symlink into the sink.
    await expect(
      fsp.readFile(join(sink, 'marker'), 'utf8')
    ).rejects.toBeDefined()
  })
})
