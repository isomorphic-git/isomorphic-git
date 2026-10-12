/* eslint-env node, browser, jasmine */
import {
  Errors,
  add,
  branch,
  checkout,
  commit,
  init,
  listUnmergedFiles,
  merge,
  readBlob,
  remove,
  resolveRef,
} from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('listUnmergedFiles', () => {
  const author = {
    name: 'Mr. Test',
    email: 'mrtest@example.com',
    timestamp: 1262356920,
    timezoneOffset: -0,
  }

  async function conflict(fixture, ours, theirs) {
    const { fs, dir, gitdir } = await makeFixture(fixture)
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        ours,
        theirs,
        abortOnConflict: false,
        author,
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)
    return { fs, dir, gitdir }
  }

  it('lists nothing when no file is unmerged', async () => {
    const { fs, gitdir } = await makeFixture('test-listFiles')
    expect(await listUnmergedFiles({ fs, gitdir })).toEqual([])
  })

  it('lists the three versions of a file both sides changed', async () => {
    const { fs, dir, gitdir } = await conflict('test-abortMerge', 'a', 'b')
    const base = '2d7b1a9b82e52bd8648cf156aa559eff3a27a678'
    const version = async (ref, filepath) => ({
      oid: (await readBlob({ fs, gitdir, oid: ref, filepath })).oid,
      mode: '100644',
    })
    const a = await resolveRef({ fs, gitdir, ref: 'a' })
    const b = await resolveRef({ fs, gitdir, ref: 'b' })

    expect(await listUnmergedFiles({ fs, dir, gitdir })).toEqual([
      {
        filepath: 'a',
        base: await version(base, 'a'),
        ours: await version(a, 'a'),
        theirs: await version(b, 'a'),
      },
      {
        filepath: 'b',
        base: await version(base, 'b'),
        ours: await version(a, 'b'),
        theirs: await version(b, 'b'),
      },
    ])

    // Staging a resolution takes the file off the list.
    await fs.write(`${dir}/a`, 'resolved')
    await add({ fs, dir, gitdir, filepath: 'a' })
    const left = await listUnmergedFiles({ fs, dir, gitdir })
    expect(left.map(file => file.filepath)).toEqual(['b'])
  })

  it('leaves out the side that deleted the file', async () => {
    const { fs, dir, gitdir } = await conflict(
      'test-merge',
      'g',
      'g-delete-file'
    )
    const [file] = await listUnmergedFiles({ fs, dir, gitdir })
    expect(file.filepath).toBe('o.txt')
    expect(file.base).toBeDefined()
    expect(file.ours).toBeDefined()
    expect(file.theirs).toBeUndefined()
  })

  it('leaves out a missing base or ours', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-listUnmergedFiles-sides')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/gone.txt`, 'base\n')
    await add({ fs, dir, gitdir, filepath: 'gone.txt' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    await branch({ fs, dir, gitdir, ref: 'other', checkout: true })
    await fs.write(`${dir}/gone.txt`, 'theirs\n')
    await fs.write(`${dir}/both.txt`, 'theirs\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    await commit({ fs, dir, gitdir, message: 'other', author })
    await checkout({ fs, dir, gitdir, ref: 'master' })
    await fs.rm(`${dir}/gone.txt`)
    await remove({ fs, dir, gitdir, filepath: 'gone.txt' })
    await fs.write(`${dir}/both.txt`, 'ours\n')
    await add({ fs, dir, gitdir, filepath: 'both.txt' })
    await commit({ fs, dir, gitdir, message: 'master', author })
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        theirs: 'other',
        abortOnConflict: false,
        author,
      })
    } catch (e) {
      error = e
    }
    expect(error.code).toBe(Errors.MergeConflictError.code)

    const files = await listUnmergedFiles({ fs, dir, gitdir })
    const mode = side => side && side.mode
    expect(
      files.map(f => [f.filepath, mode(f.base), mode(f.ours), mode(f.theirs)])
    ).toEqual([
      ['both.txt', undefined, '100644', '100644'], // added on both sides
      ['gone.txt', '100644', undefined, '100644'], // deleted by us
    ])
  })

  it('reports each side with its own mode', async () => {
    const { fs, dir, gitdir } = await makeFixture('tmp-listUnmergedFiles-modes')
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/run.sh`, 'base\n', { mode: 0o777 })
    await add({ fs, dir, gitdir, filepath: 'run.sh' })
    await commit({ fs, dir, gitdir, message: 'base', author })
    await branch({ fs, dir, gitdir, ref: 'other', checkout: true })
    await fs.write(`${dir}/run.sh`, 'theirs\n', { mode: 0o777 })
    await add({ fs, dir, gitdir, filepath: 'run.sh' })
    await commit({ fs, dir, gitdir, message: 'other', author })
    await checkout({ fs, dir, gitdir, ref: 'master' })
    // ours drops the executable bit
    await fs.rm(`${dir}/run.sh`)
    await fs.write(`${dir}/run.sh`, 'ours\n')
    await add({ fs, dir, gitdir, filepath: 'run.sh' })
    await commit({ fs, dir, gitdir, message: 'master', author })
    let error = null
    try {
      await merge({
        fs,
        dir,
        gitdir,
        theirs: 'other',
        abortOnConflict: false,
        author,
      })
    } catch (e) {
      error = e
    }
    expect(error.code).toBe(Errors.MergeConflictError.code)

    const [file] = await listUnmergedFiles({ fs, dir, gitdir })
    const sides = [file.base, file.ours, file.theirs]
    expect(sides.map(side => side && side.mode)).toEqual([
      '100755',
      '100644',
      '100755',
    ])
  })
})
