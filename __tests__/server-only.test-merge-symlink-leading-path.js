/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// With `abortOnConflict: false`, merge writes the merged result tree to the
// working directory so the caller can resolve the conflict markers by hand.
// That writer must not write a file whose parent path traverses a symlink,
// exactly like checkout and cherryPick. Canonical git replaces the symlink
// with a real directory instead of following it; isomorphic-git refuses the
// unsafe write. (node-only: needs real symlinks.)
describe('merge symlinked leading path', () => {
  it('does not flush conflicts through a tracked directory symlink', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-merge-symlink-leading-path'
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

    // Base: `link` is a symlink pointing outside the worktree, plus a file
    // that both sides will edit so the merge cannot resolve itself.
    const linkBlob = await write(Buffer.from(sink))
    const baseCommit = await commit(
      'base\n',
      await tree([
        { mode: '120000', path: 'link', oid: linkBlob, type: 'blob' },
        {
          mode: '100644',
          path: 'shared.txt',
          oid: await write(Buffer.from('base\n')),
          type: 'blob',
        },
      ]),
      []
    )

    // Ours: keep the `link` symlink, edit shared.txt.
    const ourCommit = await commit(
      'ours\n',
      await tree([
        { mode: '120000', path: 'link', oid: linkBlob, type: 'blob' },
        {
          mode: '100644',
          path: 'shared.txt',
          oid: await write(Buffer.from('ours\n')),
          type: 'blob',
        },
      ]),
      [baseCommit]
    )

    // Theirs: replace `link` with a directory holding `link/marker`, and edit
    // shared.txt differently so shared.txt conflicts.
    const theirCommit = await commit(
      'theirs\n',
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
        {
          mode: '100644',
          path: 'shared.txt',
          oid: await write(Buffer.from('theirs\n')),
          type: 'blob',
        },
      ]),
      [baseCommit]
    )

    for (const [ref, value] of [
      ['refs/heads/master', ourCommit],
      ['refs/heads/theirs', theirCommit],
    ]) {
      await git.writeRef({ fs, dir, gitdir, ref, value, force: true })
    }
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'HEAD',
      value: 'refs/heads/master',
      symbolic: true,
      force: true,
    })

    // Checkout ours so the `link` symlink exists on disk.
    await git.checkout({ fs, dir, gitdir, ref: 'master', force: true })

    // Sanity: the symlink is really on disk.
    const lst = await fsp.lstat(join(dir, 'link'))
    expect(lst.isSymbolicLink()).toBe(true)

    let error
    try {
      await git.merge({
        fs,
        dir,
        gitdir,
        ours: 'master',
        theirs: 'theirs',
        abortOnConflict: false,
        author,
        committer: author,
      })
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
