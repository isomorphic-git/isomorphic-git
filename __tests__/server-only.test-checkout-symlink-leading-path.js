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
    const author = { name: 't', email: 't@t', timestamp: 1000, timezoneOffset: 0 }

    // A directory outside the working tree that the symlink will point at.
    const sink = `${dir}-sink`
    await fsp.mkdir(sink, { recursive: true })

    // Build a commit whose tree contains config/inside.
    await git.init({ fs, dir, gitdir })
    const blob = await git.writeBlob({ fs, dir, gitdir, blob: Buffer.from('payload\n') })
    const sub = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '100644', path: 'inside', oid: blob, type: 'blob' }],
    })
    const root = await git.writeTree({
      fs,
      dir,
      gitdir,
      tree: [{ mode: '040000', path: 'config', oid: sub, type: 'tree' }],
    })
    const commit = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: { message: 'c\n', tree: root, parent: [], author, committer: author },
    })
    await git.writeRef({ fs, dir, gitdir, ref: 'refs/heads/master', value: commit, force: true })
    await git.writeRef({ fs, dir, gitdir, ref: 'HEAD', value: 'refs/heads/master', symbolic: true, force: true })

    // Plant `config` as a directory symlink and track it, so checkout sees a
    // symlink -> directory change and reaches the file-write step.
    try {
      await fsp.symlink(sink, join(dir, 'config'))
    } catch (e) {
      // Symlink creation not permitted here (e.g. Windows without privilege).
      return
    }
    await git.add({ fs, dir, gitdir, filepath: 'config' })

    let error
    try {
      await git.checkout({ fs, dir, gitdir, ref: 'master', force: true })
    } catch (e) {
      error = e
    }
    expect(error).toBeDefined()
    const inner = error && error.errors && error.errors[0] ? error.errors[0] : error
    expect(`${inner.code || inner.name}`).toMatch(/unsafe/i)

    // The file must not have been written through the symlink into the sink.
    await expect(
      fsp.readFile(join(sink, 'inside'), 'utf8')
    ).rejects.toBeDefined()
  })
})
