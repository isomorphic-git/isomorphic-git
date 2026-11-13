/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'
import { GitIndexManager } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'
import { caseInsensitive } from './__helpers__/caseInsensitive.js'

// abortMerge resets staged files to HEAD. A symlink among them has to be
// restored as a link, not as a file holding the target path. (node-only:
// needs real symlinks.)
describe('abortMerge symlink', () => {
  it('restores a symlink', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-abortMerge-symlink')
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'a.txt'), 'a\n')
    await fs.write(join(dir, 'c.txt'), 'c\n')
    await fsp.symlink('a.txt', join(dir, 'link'))
    await git.add({ fs, dir, gitdir, filepath: '.' })
    await git.commit({ fs, dir, gitdir, message: 'base', author })
    // A staged change to the link, as a merge leaves it.
    await fsp.unlink(join(dir, 'link'))
    await fsp.symlink('c.txt', join(dir, 'link'))
    await git.add({ fs, dir, gitdir, filepath: 'link' })

    await git.abortMerge({ fs, dir, gitdir })

    expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)
    expect(await fsp.readlink(join(dir, 'link'))).toBe('a.txt')
    expect(await fs.read(join(dir, 'c.txt'), 'utf8')).toBe('c\n')
    // Read before statusMatrix, which refreshes index entries from disk.
    const mode = await GitIndexManager.acquire(
      { fs, gitdir, cache: {} },
      async index => index.entriesMap.get('link').mode
    )
    expect(mode).toBe(0o120000)
    const matrix = await git.statusMatrix({ fs, dir, gitdir })
    expect(matrix.every(row => row.slice(1).join() === '1,1,1')).toBe(true)
  })

  it('restores a folder the merge replaced with a symlink, without writing through it', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-abortMerge-folder-to-link'
    )
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }
    const outside = `${dir}-outside`
    await fs.write(join(outside, 'a.txt'), 'outside\n')
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'link', 'a.txt'), 'a\n')
    await git.add({ fs, dir, gitdir, filepath: 'link' })
    await git.commit({ fs, dir, gitdir, message: 'base', author })
    // The commit being merged replaces the folder with a symlink to a folder
    // outside the repository, and the merge left that staged.
    await git.remove({ fs, dir, gitdir, filepath: 'link/a.txt' })
    await fsp.rm(join(dir, 'link'), { recursive: true })
    await fsp.symlink(outside, join(dir, 'link'))
    await git.add({ fs, dir, gitdir, filepath: 'link' })
    const theirs = await git.commit({
      fs,
      dir,
      gitdir,
      message: 'theirs',
      author,
      noUpdateBranch: true,
    })
    await fs.write(join(gitdir, 'MERGE_HEAD'), `${theirs}\n`)

    await git.abortMerge({ fs, dir, gitdir })

    expect(await fs.read(join(outside, 'a.txt'), 'utf8')).toBe('outside\n')
    expect((await fsp.lstat(join(dir, 'link'))).isDirectory()).toBe(true)
    expect(await fs.read(join(dir, 'link', 'a.txt'), 'utf8')).toBe('a\n')
    expect(await git.listFiles({ fs, dir, gitdir })).toEqual(['link/a.txt'])
  })

  it('refuses to restore a file below a symlink of the user', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-abortMerge-user-link')
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }
    const outside = `${dir}-outside`
    await fs.write(join(outside, 'd', 'a.txt'), 'outside\n')
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'link', 'd', 'a.txt'), 'a\n')
    await git.add({ fs, dir, gitdir, filepath: 'link' })
    await git.commit({ fs, dir, gitdir, message: 'base', author })
    // The merge left link/d/a.txt conflicted; then the user replaced the
    // folder with a symlink to a folder outside the repository.
    const ours = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('o\n'),
    })
    const theirs = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('t\n'),
    })
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async index => {
      index.insert({ filepath: 'link/d/a.txt', oid: ours, stage: 2 })
      index.insert({ filepath: 'link/d/a.txt', oid: theirs, stage: 3 })
    })
    await fsp.rm(join(dir, 'link'), { recursive: true })
    await fsp.symlink(outside, join(dir, 'link'))

    let error = null
    try {
      await git.abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error.code).toBe(git.Errors.IndexResetError.code)
    expect(error.data.filepath).toBe('link')
    expect(await fs.read(join(outside, 'd', 'a.txt'), 'utf8')).toBe('outside\n')
    expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)
  })

  it('restores a symlink whose folder the merge deleted', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-abortMerge-link-folder')
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'a.txt'), 'a\n')
    await fs.write(join(dir, 's', 'z.txt'), 'z\n')
    // First in its folder, so no file restored before it makes the folder.
    await fsp.symlink('../a.txt', join(dir, 's', 'a-link'))
    await git.add({ fs, dir, gitdir, filepath: '.' })
    await git.commit({ fs, dir, gitdir, message: 'base', author })
    // The commit being merged deletes the folder, and the merge left that
    // staged.
    await git.remove({ fs, dir, gitdir, filepath: 's' })
    await fsp.rm(join(dir, 's'), { recursive: true })

    await git.abortMerge({ fs, dir, gitdir })

    expect(await fsp.readlink(join(dir, 's', 'a-link'))).toBe('../a.txt')
    expect(await fs.read(join(dir, 's', 'z.txt'), 'utf8')).toBe('z\n')
    expect(await git.listFiles({ fs, dir, gitdir })).toEqual([
      'a.txt',
      's/a-link',
      's/z.txt',
    ])
  })

  it('refuses to write below a symlink named in another case', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-abortMerge-case-link')
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }
    const outside = `${dir}-outside`
    await fs.mkdir(outside)
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'D', 'f'), 'f\n')
    await git.add({ fs, dir, gitdir, filepath: 'D' })
    await git.commit({ fs, dir, gitdir, message: 'base', author })
    // The merge left D/f conflicted; then the user replaced the folder with
    // a symlink d to a folder outside the repository.
    const blob = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('t\n'),
    })
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async index => {
      index.insert({ filepath: 'D/f', oid: blob, stage: 3 })
    })
    await fsp.rm(join(dir, 'D'), { recursive: true })
    await fsp.symlink(outside, join(dir, 'd'))
    caseInsensitive(fs)

    let error = null
    try {
      await git.abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error.code).toBe(git.Errors.IndexResetError.code)
    expect(error.data.filepath).toBe('D')
    expect(await fsp.readdir(outside)).toEqual([])
  })

  it('refuses to delete below a symlink named in another case', async () => {
    const { fs, dir, gitdir } = await makeFixture(
      'test-abortMerge-case-link-rm'
    )
    const author = {
      name: 't',
      email: 't@t',
      timestamp: 1000,
      timezoneOffset: 0,
    }
    const outside = `${dir}-outside`
    await fs.write(join(outside, 'm'), 'outside\n')
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'a.txt'), 'a\n')
    await git.add({ fs, dir, gitdir, filepath: 'a.txt' })
    await git.commit({ fs, dir, gitdir, message: 'base', author })
    // The merge left N/m conflicted (deleted by ours, so not in HEAD); then
    // the user replaced the folder with a symlink n to a folder outside.
    const base = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('m\n'),
    })
    const theirs = await git.writeBlob({
      fs,
      dir,
      gitdir,
      blob: Buffer.from('t\n'),
    })
    await GitIndexManager.acquire({ fs, gitdir, cache: {} }, async index => {
      index.insert({ filepath: 'N/m', oid: base, stage: 1 })
      index.insert({ filepath: 'N/m', oid: theirs, stage: 3 })
    })
    await fsp.symlink(outside, join(dir, 'n'))
    caseInsensitive(fs)

    let error = null
    try {
      await git.abortMerge({ fs, dir, gitdir })
    } catch (e) {
      error = e
    }

    expect(error.code).toBe(git.Errors.IndexResetError.code)
    expect(error.data.filepath).toBe('N')
    expect(await fs.read(join(outside, 'm'), 'utf8')).toBe('outside\n')
  })
})
