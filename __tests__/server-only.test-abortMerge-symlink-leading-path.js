/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// abortMerge resets the working tree to `commit`, writing every blob it finds
// there. That writer must not write a file whose parent path traverses a
// symlink, exactly like checkout and cherryPick. Unlike the merge conflict
// flush this needs no conflict and no option: `commit` is a public parameter,
// so the tree being written is caller-supplied. (node-only: needs real
// symlinks.)
describe('abortMerge symlinked leading path', () => {
  it('does not reset through a tracked directory symlink', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-abortMerge-symlink-leading-path'
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

    const write = blob => git.writeBlob({ fs, dir, gitdir, blob })
    const tree = tree => git.writeTree({ fs, dir, gitdir, tree })
    const commit = (message, treeOid, parent) =>
      git.writeCommit({
        fs,
        dir,
        gitdir,
        commit: { message, tree: treeOid, parent, author, committer: author },
      })

    // HEAD: `link` is a symlink pointing outside the worktree.
    const headCommit = await commit(
      'head\n',
      await tree([
        {
          mode: '120000',
          path: 'link',
          oid: await write(Buffer.from(sink)),
          type: 'blob',
        },
      ]),
      []
    )

    // The commit to reset to: `link` is a directory holding `link/marker`.
    const evilCommit = await commit(
      'evil\n',
      await tree([
        {
          mode: '040000',
          path: 'link',
          oid: await tree([
            {
              mode: '100644',
              path: 'marker',
              oid: await write(Buffer.from('pwned\n')),
              type: 'blob',
            },
          ]),
          type: 'tree',
        },
      ]),
      [headCommit]
    )

    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/master',
      value: headCommit,
      force: true,
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/evil',
      value: evilCommit,
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

    // Checkout HEAD so the `link` symlink exists on disk.
    await git.checkout({ fs, dir, gitdir, ref: 'master', force: true })

    // Sanity: the symlink is really on disk.
    const lst = await fsp.lstat(join(dir, 'link'))
    expect(lst.isSymbolicLink()).toBe(true)

    let error
    try {
      await git.abortMerge({ fs, dir, gitdir, commit: 'evil' })
    } catch (e) {
      error = e
    }
    expect(error).toBeDefined()
    expect(`${error.code || error.name}`).toMatch(/unsafe/i)

    // The marker must not have been written through the symlink into the sink.
    await expect(
      fsp.readFile(join(sink, 'marker'), 'utf8')
    ).rejects.toBeDefined()

    // And the symlink itself must be untouched.
    expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)
  })
})
