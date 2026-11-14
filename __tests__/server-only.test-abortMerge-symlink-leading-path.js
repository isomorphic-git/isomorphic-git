/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// abortMerge resets the working tree to `commit`, writing every blob it finds
// there. That writer must not follow a symlink, neither in the leading path nor
// at the destination itself. Unlike the merge conflict flush this needs no
// conflict and no option: `commit` is a public parameter, so the tree being
// written is caller-supplied. (node-only: needs real symlinks.)

const author = { name: 't', email: 't@t', timestamp: 1000, timezoneOffset: 0 }
const SENTINEL = 'SENTINEL-UNCHANGED\n'

/**
 * Builds `master` with a tracked `link` symlink pointing at a file outside the
 * working tree, plus an `evil` commit whose `link` entry is supplied by the
 * caller, and checks out `master` so the symlink exists on disk.
 *
 * @param {object} args
 * @param {string} args.name - fixture name
 * @param {(ctx: object) => Promise<object>} args.evilLink - `evil`'s `link` entry
 */
async function setup({ name, evilLink }) {
  const { fs, dir, gitdir } = await makeFixture(name)

  // A file outside the working tree that the tracked symlink points at.
  const sink = `${dir}-sink`
  await fsp.mkdir(sink, { recursive: true })
  const secret = join(sink, 'secret')
  await fsp.writeFile(secret, SENTINEL)

  await git.init({ fs, dir, gitdir })
  const ctx = {
    write: blob => git.writeBlob({ fs, dir, gitdir, blob: Buffer.from(blob) }),
    tree: tree => git.writeTree({ fs, dir, gitdir, tree }),
  }
  const commit = (message, tree, parent) =>
    git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: { message, tree, parent, author, committer: author },
    })

  const head = await commit(
    'head\n',
    await ctx.tree([
      {
        mode: '120000',
        path: 'link',
        oid: await ctx.write(secret),
        type: 'blob',
      },
    ]),
    []
  )
  const evil = await commit('evil\n', await ctx.tree([await evilLink(ctx)]), [
    head,
  ])

  for (const [ref, value] of [
    ['refs/heads/master', head],
    ['refs/heads/evil', evil],
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

  // Checkout HEAD so the `link` symlink exists on disk.
  await git.checkout({ fs, dir, gitdir, ref: 'master', force: true })
  expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)

  return { fs, dir, gitdir, secret }
}

describe('abortMerge symlink safety', () => {
  it('does not reset through a tracked directory symlink', async () => {
    // `evil` turns `link` into a directory, so `link/marker` has a symlinked
    // leading path and the whole reset is refused.
    const { fs, dir, gitdir, secret } = await setup({
      name: 'test-abortMerge-symlink-leading-path',
      evilLink: async ctx => ({
        mode: '040000',
        path: 'link',
        oid: await ctx.tree([
          {
            mode: '100644',
            path: 'marker',
            oid: await ctx.write('pwned\n'),
            type: 'blob',
          },
        ]),
        type: 'tree',
      }),
    })

    let error
    try {
      await git.abortMerge({ fs, dir, gitdir, commit: 'evil' })
    } catch (e) {
      error = e
    }
    expect(error).toBeDefined()
    expect(`${error.code || error.name}`).toMatch(/unsafe/i)

    await expect(
      fsp.readFile(join(`${dir}-sink`, 'marker'), 'utf8')
    ).rejects.toBeDefined()
    expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)
    expect(await fsp.readFile(secret, 'utf8')).toBe(SENTINEL)
  })

  it('restores binary content byte for byte', async () => {
    // The reset writes the blob as it is stored. Decoding it as UTF-8 first
    // would replace every invalid byte with U+FFFD and change the file size.
    const { fs, dir, gitdir } = await makeFixture('test-abortMerge-binary')
    const content = Buffer.from([0x00, 0xff, 0xfe, 0x80, 0x01, 0xc3, 0x28])

    await git.init({ fs, dir, gitdir })
    const commit = await git.writeCommit({
      fs,
      dir,
      gitdir,
      commit: {
        message: 'head\n',
        parent: [],
        author,
        committer: author,
        tree: await git.writeTree({
          fs,
          dir,
          gitdir,
          tree: [
            {
              mode: '100644',
              path: 'blob.bin',
              oid: await git.writeBlob({ fs, dir, gitdir, blob: content }),
              type: 'blob',
            },
          ],
        }),
      },
    })
    await git.writeRef({
      fs,
      dir,
      gitdir,
      ref: 'refs/heads/master',
      value: commit,
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
    await git.checkout({ fs, dir, gitdir, ref: 'master', force: true })

    await git.abortMerge({ fs, dir, gitdir })

    expect([...(await fsp.readFile(join(dir, 'blob.bin')))]).toEqual([
      ...content,
    ])
  })

  it('replaces a tracked symlink rather than writing through it', async () => {
    // `evil` replaces `link` with a regular file. Resetting to it must replace
    // the symlink on disk, not write the new contents into the file it points
    // at outside the working tree.
    const { fs, dir, gitdir, secret } = await setup({
      name: 'test-abortMerge-symlink-replaced',
      evilLink: async ctx => ({
        mode: '100644',
        path: 'link',
        oid: await ctx.write('now a regular file\n'),
        type: 'blob',
      }),
    })

    await git.abortMerge({ fs, dir, gitdir, commit: 'evil' })

    expect(await fsp.readFile(secret, 'utf8')).toBe(SENTINEL)
    const lst = await fsp.lstat(join(dir, 'link'))
    expect(lst.isSymbolicLink()).toBe(false)
    expect(lst.isFile()).toBe(true)
    expect(await fsp.readFile(join(dir, 'link'), 'utf8')).toBe(
      'now a regular file\n'
    )
  })
})
