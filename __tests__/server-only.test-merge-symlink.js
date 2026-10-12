/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// A conflicted merge rewrites the files theirs changed. A symlink among them
// cannot be rewritten in place, so it has to be replaced. (node-only: needs
// real symlinks.)
describe('merge symlink', () => {
  it('replaces a symlink whose target changed', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-merge-symlink')
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'conflict.txt'), 'one\ntwo\nthree\n')
    await fs.write(join(dir, 'a.txt'), 'a\n')
    await fs.write(join(dir, 'b.txt'), 'b\n')
    await fsp.symlink('a.txt', join(dir, 'link'))
    await git.add({ fs, dir, gitdir, filepath: '.' })
    const baseOid = await git.commit({
      fs,
      dir,
      gitdir,
      message: 'base',
      author,
    })

    // feature points the link at b.txt and edits conflict.txt; built from
    // objects, since checkout does not rewrite a symlink either.
    const blob = content =>
      git.writeBlob({ fs, gitdir, blob: Buffer.from(content) })
    const { tree } = await git.readTree({ fs, gitdir, oid: baseOid })
    for (const entry of tree) {
      if (entry.path === 'link') entry.oid = await blob('b.txt')
      if (entry.path === 'conflict.txt') {
        entry.oid = await blob('one\nfeature\nthree\n')
      }
    }
    await git.commit({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/feature',
      parent: [baseOid],
      tree: await git.writeTree({ fs, gitdir, tree }),
      message: 'feature',
      author,
    })
    await fs.write(join(dir, 'conflict.txt'), 'one\nmaster\nthree\n')
    await git.add({ fs, dir, gitdir, filepath: 'conflict.txt' })
    await git.commit({ fs, dir, gitdir, message: 'master', author })

    let error = null
    try {
      await git.merge({
        fs,
        dir,
        gitdir,
        ours: 'master',
        theirs: 'feature',
        abortOnConflict: false,
        author,
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(git.Errors.MergeConflictError.code)
    expect(error.data.filepaths).toEqual(['conflict.txt'])
    expect(await fsp.readlink(join(dir, 'link'))).toBe('b.txt')
    expect(await git.status({ fs, dir, gitdir, filepath: 'link' })).toBe(
      'modified'
    )
  })
})
