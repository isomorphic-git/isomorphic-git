/* eslint-env node, jasmine */
import { promises as fsp } from 'fs'
import { join } from 'path'

import * as git from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

// With `abortOnConflict: false`, merge writes the merged result tree to the
// working directory so the caller can resolve the conflict markers by hand.
// That writer must not follow a symlink, neither in the leading path nor at
// the destination itself, because a tracked symlink can point anywhere.
// Canonical git replaces the symlink instead of writing through it.
// (node-only: needs real symlinks.)

const author = { name: 't', email: 't@t', timestamp: 1000, timezoneOffset: 0 }
const SENTINEL = 'SENTINEL-UNCHANGED\n'

/**
 * Builds `base` with a tracked `link` symlink pointing at a file outside the
 * working tree, then `master` and `theirs` which both edit `shared.txt` so the
 * merge always conflicts. `theirLink` decides what `theirs` does with `link`.
 *
 * @param {object} args
 * @param {string} args.name - fixture name
 * @param {(ctx: object) => Promise<object>} args.theirLink - `theirs`' `link` entry
 */
async function setup({ name, theirLink }) {
  const { fs, dir, gitdir } = await makeFixture(name)

  // A file outside the working tree that the tracked symlink points at.
  const sink = `${dir}-sink`
  await fsp.mkdir(sink, { recursive: true })
  const secret = join(sink, 'secret')
  await fsp.writeFile(secret, SENTINEL)

  await git.init({ fs, dir, gitdir })
  const ctx = {
    secret,
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

  const link = {
    mode: '120000',
    path: 'link',
    oid: await ctx.write(secret),
    type: 'blob',
  }
  const shared = async content => ({
    mode: '100644',
    path: 'shared.txt',
    oid: await ctx.write(content),
    type: 'blob',
  })

  const base = await commit(
    'base\n',
    await ctx.tree([link, await shared('base\n')]),
    []
  )
  const ours = await commit(
    'ours\n',
    await ctx.tree([link, await shared('ours\n')]),
    [base]
  )
  const theirs = await commit(
    'theirs\n',
    await ctx.tree([await theirLink(ctx), await shared('theirs\n')]),
    [base]
  )

  for (const [ref, value] of [
    ['refs/heads/master', ours],
    ['refs/heads/theirs', theirs],
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
  expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)

  return { fs, dir, gitdir, secret }
}

async function mergeTheirs({ fs, dir, gitdir }) {
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
    return e
  }
}

describe('merge symlink safety', () => {
  it('does not flush conflicts through a tracked directory symlink', async () => {
    // `theirs` turns `link` into a directory, so `link/marker` has a symlinked
    // leading path. There is nothing safe to write, so the flush is refused.
    const { fs, dir, gitdir, secret } = await setup({
      name: 'test-merge-symlink-leading-path',
      theirLink: async ctx => ({
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

    const error = await mergeTheirs({ fs, dir, gitdir })
    expect(error).toBeDefined()
    expect(`${error.code || error.name}`).toMatch(/unsafe/i)

    // Nothing was written through the symlink, and it is still a symlink.
    await expect(
      fsp.readFile(join(`${dir}-sink`, 'marker'), 'utf8')
    ).rejects.toBeDefined()
    expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)
    expect(await fsp.readFile(secret, 'utf8')).toBe(SENTINEL)
  })

  it('keeps an unchanged tracked symlink and does not write through it', async () => {
    // `link` is identical on all three sides, so the merged tree still carries
    // it. Flushing the conflict in `shared.txt` must not rewrite `link`'s blob
    // through the symlink into the file it points at.
    const { fs, dir, gitdir, secret } = await setup({
      name: 'test-merge-symlink-unchanged',
      theirLink: async ctx => ({
        mode: '120000',
        path: 'link',
        oid: await ctx.write(ctx.secret),
        type: 'blob',
      }),
    })

    const error = await mergeTheirs({ fs, dir, gitdir })
    expect(`${error.code || error.name}`).toBe('MergeConflictError')

    expect(await fsp.readFile(secret, 'utf8')).toBe(SENTINEL)
    expect((await fsp.lstat(join(dir, 'link'))).isSymbolicLink()).toBe(true)
    expect(await fsp.readlink(join(dir, 'link'))).toBe(secret)
    // The conflict itself was still flushed.
    expect(await fsp.readFile(join(dir, 'shared.txt'), 'utf8')).toMatch(
      /<<<<<<</
    )
  })

  it('replaces a tracked symlink rather than writing through it', async () => {
    // `theirs` replaces `link` with a regular file. That is an ordinary merge
    // result, so it must succeed - but by replacing the symlink on disk, not by
    // writing the new contents into whatever it points at.
    const { fs, dir, gitdir, secret } = await setup({
      name: 'test-merge-symlink-replaced',
      theirLink: async ctx => ({
        mode: '100644',
        path: 'link',
        oid: await ctx.write('now a regular file\n'),
        type: 'blob',
      }),
    })

    const error = await mergeTheirs({ fs, dir, gitdir })
    expect(`${error.code || error.name}`).toBe('MergeConflictError')

    expect(await fsp.readFile(secret, 'utf8')).toBe(SENTINEL)
    const lst = await fsp.lstat(join(dir, 'link'))
    expect(lst.isSymbolicLink()).toBe(false)
    expect(lst.isFile()).toBe(true)
    expect(await fsp.readFile(join(dir, 'link'), 'utf8')).toBe(
      'now a regular file\n'
    )
  })
})
