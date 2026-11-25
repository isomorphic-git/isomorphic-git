/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// stash apply restores the stashed tree via applyTreeChanges, the same writer
// cherryPick uses. When the stashed change turns a tracked symlink into a
// regular file, the destination on disk is a symlink (the working tree was
// reset to HEAD by stash push). The write must replace the symlink, not follow
// it out of the working tree. (node-only: needs real symlinks.)
describe('stash symlink destination', () => {
  it('does not write through a tracked symlink destination', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-stash-symlink-destination'
    )
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }

    const sink = `${dir}-sink`
    await fsp.mkdir(sink, { recursive: true })
    const sinkTarget = join(sink, 'startup')

    await git.init({ fs, dir, gitdir })
    await git.setConfig({ fs, dir, gitdir, path: 'user.name', value: 't' })
    await git.setConfig({ fs, dir, gitdir, path: 'user.email', value: 't@t' })

    // HEAD: `link` is a symlink pointing at the non-existent outside file.
    const linkBlob = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from(sinkTarget),
    })
    const headTree = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '120000', path: 'link', oid: linkBlob, type: 'blob' }],
    })
    const headCommit = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'head\n',
        tree: headTree,
        parent: [],
        author,
        committer: author,
      },
    })
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
      ref: 'HEAD',
      value: 'refs/heads/master',
      symbolic: true,
      force: true,
    })

    // Checkout so the `link` symlink is on disk.
    await git.checkout({ fs, dir, gitdir, ref: 'master', force: true })
    expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)

    // Working-tree change: replace the symlink with a regular file and stage it.
    await fsp.unlink(join(dir, 'link'))
    await fsp.writeFile(join(dir, 'link'), 'pwned\n')
    await git.add({ fs, dir, gitdir, filepath: 'link' })

    // stash push records the change and resets the working tree to HEAD, so
    // `link` is a symlink on disk again.
    await git.stash({ fs, dir, gitdir, op: 'push' })
    expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)

    // stash apply restores the regular file over the on-disk symlink.
    await git.stash({ fs, dir, gitdir, op: 'apply' })

    // The regular file must not have escaped through the symlink.
    await expect(fsp.readFile(sinkTarget, 'utf8')).rejects.toBeDefined()

    // The symlink must have been replaced in place by the regular file.
    const after = await fsp.lstat(join(dir, 'link'))
    expect(after.isSymbolicLink()).toBe(false)
    expect(after.isFile()).toBe(true)
    expect(await fsp.readFile(join(dir, 'link'), 'utf8')).toBe('pwned\n')
  })
})
