/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'
import { GitIndexManager, applyMergedTree } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

// What a conflicted merge writes to the working tree, where only real
// symlinks and file modes can tell. (node-only)
describe('merge working tree', () => {
  const author = {
    name: 't',
    email: 't@t',
    timestamp: 1000,
    timezoneOffset: 0,
  }

  // base: conflict.txt, a.txt and whatever `base` adds. feature edits
  // conflict.txt and changes its tree with `feature` (built from objects,
  // since checkout cannot make every change); master edits conflict.txt and
  // makes the changes of `master`.
  /**
   * @param {string} name
   * @param {Object} changes
   * @param {(dir: string) => Promise<any>} [changes.base]
   * @param {(entries: any[], helpers: any) => Promise<void>} changes.feature
   * @param {(dir: string) => Promise<any>} [changes.master]
   */
  async function setup(name, { base, feature, master }) {
    const { fs, dir, gitdir } = await makeFixture(name)
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'conflict.txt'), 'one\ntwo\nthree\n')
    await fs.write(join(dir, 'a.txt'), 'a\n')
    if (base) await base(dir)
    await git.add({ fs, dir, gitdir, filepath: '.' })
    const baseOid = await git.commit({
      fs,
      dir,
      gitdir,
      message: 'base',
      author,
    })

    const blob = async content => ({
      mode: '100644',
      type: /** @type {const} */ ('blob'),
      oid: await git.writeBlob({ fs, gitdir, blob: Buffer.from(content) }),
    })
    const tree = async entries => ({
      mode: '040000',
      type: /** @type {const} */ ('tree'),
      oid: await git.writeTree({ fs, gitdir, tree: entries }),
    })
    const { tree: entries } = await git.readTree({ fs, gitdir, oid: baseOid })
    for (const entry of entries) {
      if (entry.path === 'conflict.txt') {
        Object.assign(entry, await blob('one\nfeature\nthree\n'))
      }
    }
    await feature(entries, { blob, tree })
    await git.commit({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/feature',
      parent: [baseOid],
      tree: (await tree(entries)).oid,
      message: 'feature',
      author,
    })

    await fs.write(join(dir, 'conflict.txt'), 'one\nmaster\nthree\n')
    if (master) await master(dir)
    await git.add({ fs, dir, gitdir, filepath: '.' })
    await git.commit({ fs, dir, gitdir, message: 'master', author })
    return { fs, dir, gitdir }
  }

  // No path in the index is both merged (stage 0) and unmerged, which git
  // rejects.
  async function expectValidIndex({ fs, gitdir }) {
    const stages = await GitIndexManager.acquire(
      { fs, gitdir, cache: {} },
      async index => index.entriesFlat.map(e => [e.path, e.flags.stage])
    )
    const unmerged = new Set(
      stages.filter(([, stage]) => stage > 0).map(([path]) => path)
    )
    expect(
      stages.filter(([path, stage]) => stage === 0 && unmerged.has(path))
    ).toEqual([])
  }

  async function mergeFeature({ fs, dir, gitdir }) {
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
    return error
  }

  it('writes a symlink in a new directory and executable bits', async () => {
    const repo = await setup('test-merge-worktree-new', {
      // a.txt becomes executable, run.sh is new and executable, and a symlink
      // comes in a directory that does not exist yet.
      feature: async (entries, { blob, tree }) => {
        for (const entry of entries) {
          if (entry.path === 'a.txt') entry.mode = '100755'
        }
        entries.push({
          path: 'run.sh',
          ...(await blob('#!/bin/sh\n')),
          mode: '100755',
        })
        const link = { path: 'link', ...(await blob('../../a.txt')) }
        link.mode = '120000'
        const dir = { path: 'dir', ...(await tree([link])) }
        entries.push({ path: 'new', ...(await tree([dir])) })
      },
    })
    const { fs, dir, gitdir } = repo

    const error = await mergeFeature(repo)
    expect(error.data.filepaths).toEqual(['conflict.txt'])
    expect(await fsp.readlink(join(dir, 'new/dir/link'))).toBe('../../a.txt')
    expect((await fsp.lstat(join(dir, 'a.txt'))).mode & 0o111).not.toBe(0)
    expect((await fsp.lstat(join(dir, 'run.sh'))).mode & 0o111).not.toBe(0)
    expect(await git.listFiles({ fs, dir, gitdir })).toEqual([
      'a.txt',
      'conflict.txt',
      'new/dir/link',
      'run.sh',
    ])
  })

  it('keeps our symlink when both sides change its target, like git', async () => {
    const repo = await setup('test-merge-worktree-link', {
      base: dir => fsp.symlink('a.txt', join(dir, 'link')),
      feature: async (entries, { blob }) => {
        for (const entry of entries) {
          if (entry.path === 'link') {
            entry.oid = (await blob('theirs-target')).oid
          }
        }
      },
      master: async dir => {
        await fsp.unlink(join(dir, 'link'))
        await fsp.symlink('ours-target', join(dir, 'link'))
      },
    })
    const { fs, dir, gitdir } = repo

    const error = await mergeFeature(repo)
    expect(error.data.filepaths.sort()).toEqual(['conflict.txt', 'link'])
    expect(await fsp.readlink(join(dir, 'link'))).toBe('ours-target')
    const files = await git.listUnmergedFiles({ fs, dir, gitdir })
    expect(
      files.map(({ filepath, base, ours, theirs }) => [
        filepath,
        ...[base, ours, theirs].map(side => side && side.mode),
      ])
    ).toEqual([
      ['conflict.txt', '100644', '100644', '100644'],
      ['link', '120000', '120000', '120000'],
    ])
  })

  it('records a symlink and a regular file under two names, like git', async () => {
    // link: ours points it elsewhere, theirs makes it a regular file.
    // file: ours edits it, theirs makes it a symlink.
    const repo = await setup('test-merge-worktree-types', {
      base: async dir => {
        await fsp.symlink('a.txt', join(dir, 'link'))
        await fsp.writeFile(join(dir, 'file'), 'base\n')
      },
      feature: async (entries, { blob }) => {
        for (const entry of entries) {
          if (entry.path === 'link') {
            Object.assign(entry, await blob('now a file\n'))
          }
          if (entry.path === 'file') {
            Object.assign(entry, await blob('a.txt'), { mode: '120000' })
          }
        }
      },
      master: async dir => {
        await fsp.unlink(join(dir, 'link'))
        await fsp.symlink('ours-target', join(dir, 'link'))
        await fsp.writeFile(join(dir, 'file'), 'ours\n')
      },
    })
    const { fs, dir, gitdir } = repo

    const error = await mergeFeature(repo)
    expect(error.data.filepaths.sort()).toEqual([
      'conflict.txt',
      'file',
      'file~HEAD',
      'link',
      'link~feature',
    ])
    // The symlink keeps the name, the regular file gets its side's label,
    // and the base goes with the version of the same type.
    expect(await fsp.readlink(join(dir, 'link'))).toBe('ours-target')
    expect(await fs.read(join(dir, 'link~feature'), 'utf8')).toBe(
      'now a file\n'
    )
    expect(await fsp.readlink(join(dir, 'file'))).toBe('a.txt')
    expect(await fs.read(join(dir, 'file~HEAD'), 'utf8')).toBe('ours\n')
    const files = await git.listUnmergedFiles({ fs, dir, gitdir })
    expect(
      files.map(({ filepath, base, ours, theirs }) => [
        filepath,
        ...[base, ours, theirs].map(side => side && side.mode),
      ])
    ).toEqual([
      ['conflict.txt', '100644', '100644', '100644'],
      ['file', undefined, undefined, '120000'],
      ['file~HEAD', '100644', '100644', undefined],
      ['link', '120000', '120000', undefined],
      ['link~feature', undefined, undefined, '100644'],
    ])
    await expectValidIndex(repo)
  })

  it('keeps the mode of a file it moves aside', async () => {
    // theirs replaces the directory d with an executable; ours edits d/x.
    const repo = await setup('test-merge-worktree-aside-mode', {
      base: dir =>
        fsp
          .mkdir(join(dir, 'd'))
          .then(() => fsp.writeFile(join(dir, 'd/x'), 'x\n')),
      feature: async (entries, { blob }) => {
        const d = entries.findIndex(entry => entry.path === 'd')
        entries[d] = {
          path: 'd',
          ...(await blob('#!/bin/sh\n')),
          mode: '100755',
        }
      },
      master: dir => fsp.writeFile(join(dir, 'd/x'), 'ours\n'),
    })
    const { fs, dir, gitdir } = repo

    const error = await mergeFeature(repo)
    expect(error.data.filepaths.sort()).toEqual([
      'conflict.txt',
      'd/x',
      'd~feature',
    ])
    expect((await fsp.lstat(join(dir, 'd~feature'))).mode & 0o111).not.toBe(0)
    const files = await git.listUnmergedFiles({ fs, dir, gitdir })
    const aside = files.find(file => file.filepath === 'd~feature')
    expect(aside && aside.theirs && aside.theirs.mode).toBe('100755')
    await expectValidIndex(repo)
  })

  // The local-changes check refuses such a merge first, so this calls the
  // code that writes the result directly.
  it('never writes through a symlink in a leading path', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-merge-worktree-leading')
    await git.init({ fs, dir, gitdir })
    await fs.write(join(dir, 'd/x'), 'x\n')
    await git.add({ fs, dir, gitdir, filepath: '.' })
    const oid = await git.commit({ fs, dir, gitdir, message: 'base', author })
    const ourOid = (await git.readCommit({ fs, gitdir, oid })).commit.tree
    const blob = async (path, content) => ({
      path,
      mode: '100644',
      type: /** @type {const} */ ('blob'),
      oid: await git.writeBlob({ fs, gitdir, blob: Buffer.from(content) }),
    })
    const d = await git.writeTree({
      fs,
      gitdir,
      tree: [await blob('new.txt', 'new\n'), await blob('x', 'x\n')],
    })
    const treeOid = await git.writeTree({
      fs,
      gitdir,
      tree: [
        {
          path: 'd',
          mode: '040000',
          type: /** @type {const} */ ('tree'),
          oid: d,
        },
      ],
    })
    // d is now a symlink to a directory outside the working tree.
    const sink = `${dir}-sink`
    await fsp.mkdir(sink, { recursive: true })
    await fsp.rename(join(dir, 'd/x'), join(sink, 'x'))
    await fsp.rmdir(join(dir, 'd'))
    await fsp.symlink(sink, join(dir, 'd'))

    await expect(
      GitIndexManager.acquire({ fs, gitdir, cache: {} }, index =>
        applyMergedTree({
          fs,
          cache: {},
          dir,
          gitdir,
          index,
          treeOid,
          ourOid,
          unmerged: new Set(),
        })
      )
    ).rejects.toMatchObject({ code: git.Errors.UnsafeFilepathError.code })
    expect(await fsp.readdir(sink)).toEqual(['x'])
  })
})
