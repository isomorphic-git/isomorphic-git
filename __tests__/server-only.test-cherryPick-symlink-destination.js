/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// cherryPick applies the resulting tree to the working directory via
// applyTreeChanges. When the picked commit turns a tracked symlink into a
// regular file, the destination itself is a symlink on disk. The write must
// not follow it: canonical git replaces the symlink with the regular file,
// it does not write through it to the link's target outside the working tree.
// (node-only: needs real symlinks.)
describe('cherryPick symlink destination', () => {
  it('does not write through a tracked symlink destination', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-cherryPick-symlink-destination'
    )
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }

    // A directory outside the working tree. `startup` does not exist yet: the
    // write can only create it, so following the link escapes the worktree.
    const sink = `${dir}-sink`
    await fsp.mkdir(sink, { recursive: true })
    const sinkTarget = join(sink, 'startup')

    await git.init({ fs, dir, gitdir })

    // Base commit: `link` is a symlink pointing at the non-existent outside file.
    const linkBlob = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from(sinkTarget),
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

    // Malicious commit (child of base): `link` becomes a regular file.
    const fileBlob = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('pwned\n'),
    })
    const evilTree = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '100644', path: 'link', oid: fileBlob, type: 'blob' }],
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

    await git.cherryPick({
      fs,
      dir,
      gitdir,
      oid: evilCommit,
      committer: author,
    })

    // The regular file must not have escaped through the symlink.
    await expect(fsp.readFile(sinkTarget, 'utf8')).rejects.toBeDefined()

    // The symlink must have been replaced in place by the regular file.
    const after = await fsp.lstat(join(dir, 'link'))
    expect(after.isSymbolicLink()).toBe(false)
    expect(after.isFile()).toBe(true)
    expect(await fsp.readFile(join(dir, 'link'), 'utf8')).toBe('pwned\n')
  })
})
