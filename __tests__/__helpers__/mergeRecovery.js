/* eslint-env node, browser, jasmine */
import {
  abortMerge,
  add,
  checkout,
  Errors,
  init,
  merge,
  readBlob,
  writeBlob,
  writeCommit,
  writeRef,
  writeTree,
} from 'isomorphic-git'
import { GitIndexManager } from 'isomorphic-git/internal-apis'

const author = {
  name: 'Test',
  email: 'test@example.com',
  timestamp: 1,
  timezoneOffset: 0,
}
const file = (content, mode = '100644') => ({
  content: Buffer.from(content),
  mode,
})

/** Run the same recovery scenarios in ordinary repositories and submodules. */
export function testMergeRecovery(makeFixture) {
  it('returns a conflicted tree without materializing working files', async () => {
    const fixture = await prepare(makeFixture, {
      base: { note: file('Base\n') },
      ours: { note: file('Local\n') },
      theirs: { note: file('Remote\n') },
    })
    const error = await getConflict(fixture)
    expect(typeof error.data.treeOid).toBe('string')
    const treeOid = error.data.treeOid
    if (!treeOid) throw new Error('Expected a conflicted tree')
    const result = await readBlob({
      ...fixture,
      oid: treeOid,
      filepath: 'note',
    })
    expect(Buffer.from(result.blob).toString()).toContain('<<<<<<<')
    expect((await fixture.fs.read(`${fixture.dir}/note`)).toString()).toBe(
      'Local\n'
    )
  })

  it('preserves executable modes in unmerged index stages', async () => {
    const fixture = await prepare(makeFixture, {
      base: { note: file('Base\n') },
      ours: { note: file('Local\n', '100755') },
      theirs: { note: file('Remote\n') },
    })
    await getConflict(fixture)
    await GitIndexManager.acquire(
      {
        fs: fixture.fs,
        gitdir: fixture.gitdirsmfullpath || fixture.gitdir,
        cache: {},
      },
      index => {
        expect(
          index.entriesMap
            .get('note')
            .stages.slice(1)
            .map(entry => entry.mode)
        ).toEqual([0o100644, 0o100755, 0o100644])
      }
    )
  })

  for (const versions of [
    [
      [0, 128],
      [0, 192],
      [0, 255],
    ],
    [[128], [192], [255]],
  ]) {
    it(`reports concurrent binary edits (base bytes: ${versions[0]})`, async () => {
      const fixture = await prepare(makeFixture, {
        base: { asset: file(versions[0]) },
        ours: { asset: file(versions[1]) },
        theirs: { asset: file(versions[2]) },
      })
      const error = await getConflict(fixture)
      const treeOid = error.data.treeOid
      if (!treeOid) throw new Error('Expected a conflicted tree')
      const result = await readBlob({
        ...fixture,
        oid: treeOid,
        filepath: 'asset',
      })
      expect([...result.blob]).toEqual(versions[1])
    })
  }

  it('reports a file-type change against a concurrent symlink edit', async () => {
    const fixture = await prepare(makeFixture, {
      base: { alias: file('base-target', '120000') },
      ours: { alias: file('base-target') },
      theirs: { alias: file('remote-target', '120000') },
    })
    await getConflict(fixture)
  })

  it('aborts staged binary changes without losing bytes or executable mode', async () => {
    const original = file([0, 128, 255], '100755')
    const fixture = await prepare(makeFixture, {
      base: { asset: original },
      ours: { asset: original },
      theirs: { asset: original },
    })
    await fixture.fs.rm(`${fixture.dir}/asset`)
    await fixture.fs.write(`${fixture.dir}/asset`, Buffer.from([0, 1]), {
      mode: 0o644,
    })
    await add({ ...fixture, filepath: 'asset' })
    await fixture.fs.write(`${fixture.dir}/draft`, 'Unrelated draft')
    await abortMerge(fixture)
    expect([...(await fixture.fs.read(`${fixture.dir}/asset`))]).toEqual([
      0, 128, 255,
    ])
    expect(
      (await fixture.fs.lstat(`${fixture.dir}/asset`)).mode & 0o111
    ).not.toBe(0)
    expect((await fixture.fs.read(`${fixture.dir}/draft`)).toString()).toBe(
      'Unrelated draft'
    )
  })

  it('restores symlinks without writing through their targets', async () => {
    const original = file('old-target', '120000')
    const fixture = await prepare(makeFixture, {
      base: { alias: original },
      ours: { alias: original },
      theirs: { alias: original },
    })
    await fixture.fs.rm(`${fixture.dir}/alias`)
    await fixture.fs.writelink(
      `${fixture.dir}/alias`,
      Buffer.from('new-target')
    )
    await add({ ...fixture, filepath: 'alias' })
    await abortMerge(fixture)
    expect((await fixture.fs.readlink(`${fixture.dir}/alias`)).toString()).toBe(
      'old-target'
    )
    expect(await fixture.fs.exists(`${fixture.dir}/new-target`)).toBe(false)
  })

  it('removes staged additions that do not exist in HEAD', async () => {
    const original = file('Original')
    const fixture = await prepare(makeFixture, {
      base: { note: original },
      ours: { note: original },
      theirs: { note: original },
    })
    await fixture.fs.write(`${fixture.dir}/added`, 'Added by merge')
    await add({ ...fixture, filepath: 'added' })
    await abortMerge(fixture)
    expect(await fixture.fs.exists(`${fixture.dir}/added`)).toBe(false)
  })

  for (const nonBlocking of [false, true]) {
    it(`replaces a symlink target during checkout (nonBlocking=${nonBlocking})`, async () => {
      const fixture = await prepare(makeFixture, {
        base: { alias: file('base-target', '120000') },
        ours: { alias: file('local-target', '120000') },
        theirs: { alias: file('remote-target', '120000') },
      })
      await checkout({ ...fixture, ref: 'incoming', force: true, nonBlocking })
      expect(
        (await fixture.fs.readlink(`${fixture.dir}/alias`)).toString()
      ).toBe('remote-target')
    })
  }
}

async function getConflict(fixture) {
  try {
    await merge({
      fs: fixture.fs,
      gitdir: fixture.gitdir,
      ours: fixture.ours,
      theirs: fixture.theirs,
      author,
      abortOnConflict: false,
      noUpdateBranch: true,
    })
  } catch (error) {
    if (!(error instanceof Errors.MergeConflictError)) throw error
    return error
  }
  throw new Error('Expected a merge conflict')
}

async function prepare(makeFixture, { base, ours, theirs }) {
  const fixture = await makeFixture('test-merge-recovery')
  await init(fixture)
  const baseOid = await createCommit(fixture, base, [], 'Base')
  const ourOid = await createCommit(fixture, ours, [baseOid], 'Local')
  const theirOid = await createCommit(fixture, theirs, [baseOid], 'Remote')
  await writeRef({
    ...fixture,
    ref: 'refs/heads/local',
    value: ourOid,
    force: true,
  })
  await writeRef({
    ...fixture,
    ref: 'refs/heads/incoming',
    value: theirOid,
    force: true,
  })
  await checkout({ ...fixture, ref: 'local', force: true })
  return { ...fixture, ours: ourOid, theirs: theirOid }
}

async function createCommit(fixture, files, parent, message) {
  const tree = await writeTree({
    ...fixture,
    tree: await Promise.all(
      Object.entries(files).map(async ([path, entry]) => ({
        path,
        mode: entry.mode,
        type: 'blob',
        oid: await writeBlob({ ...fixture, blob: entry.content }),
      }))
    ),
  })
  return writeCommit({
    ...fixture,
    commit: { tree, parent, message, author, committer: author },
  })
}
