/* eslint-env node, browser, jasmine */
import {
  abortMerge,
  add,
  checkout,
  Errors,
  init,
  merge,
  readBlob,
  setConfig,
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

  for (const hideExecutableBits of [false, true]) {
    it(`aborts staged binary changes without losing bytes or executable mode (hideExecutableBits=${hideExecutableBits})`, async () => {
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
      if (hideExecutableBits) {
        // Model filesystems such as Windows that cannot report executable bits.
        const lstat = fixture.fs.lstat.bind(fixture.fs)
        fixture.fs.lstat = async function (filepath) {
          const stats = await lstat(filepath)
          if (stats && filepath === `${fixture.dir}/asset`) stats.mode &= ~0o111
          return stats
        }
      }
      await abortMerge(fixture)
      expect([...(await fixture.fs.read(`${fixture.dir}/asset`))]).toEqual([
        0, 128, 255,
      ])
      await GitIndexManager.acquire(
        {
          fs: fixture.fs,
          gitdir: fixture.gitdirsmfullpath || fixture.gitdir,
          cache: {},
        },
        index => {
          expect(index.entriesMap.get('asset').mode).toBe(0o100755)
        }
      )
      if (!hideExecutableBits && process.platform !== 'win32') {
        expect(
          (await fixture.fs.lstat(`${fixture.dir}/asset`)).mode & 0o111
        ).not.toBe(0)
      }
      expect((await fixture.fs.read(`${fixture.dir}/draft`)).toString()).toBe(
        'Unrelated draft'
      )
    })
  }

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

  for (const { symlinks, code, canRestore } of [
    { symlinks: false, code: 'ENOSYS', canRestore: true },
    { symlinks: false, code: 'ENOTSUP', canRestore: true },
    { symlinks: false, code: 'EOPNOTSUPP', canRestore: true },
    { symlinks: true, code: 'ENOSYS', canRestore: false },
    { symlinks: false, code: 'EACCES', canRestore: false },
    { symlinks: false, code: 'EPERM', canRestore: false },
  ]) {
    it(`handles symlink restoration errors during abort (symlinks=${symlinks}, code=${code})`, async () => {
      const original = file('old-target', '120000')
      const fixture = await prepare(makeFixture, {
        base: { alias: original },
        ours: { alias: original },
        theirs: { alias: original },
      })
      await setConfig({ ...fixture, path: 'core.symlinks', value: symlinks })
      const filepath = `${fixture.dir}/alias`
      await fixture.fs.rm(filepath)
      await fixture.fs.write(filepath, 'new-target')
      await add({ ...fixture, filepath: 'alias' })
      const indexPath = `${fixture.gitdirsmfullpath || fixture.gitdir}/index`
      const indexBefore = await fixture.fs.read(indexPath)
      const error = Object.assign(new Error('Cannot create symlink'), { code })
      fixture.fs.writelink = async function () {
        throw error
      }
      if (!canRestore) {
        await expect(abortMerge(fixture)).rejects.toBe(error)
        expect((await fixture.fs.lstat(filepath)).isFile()).toBe(true)
        expect((await fixture.fs.read(filepath)).toString()).toBe('new-target')
        expect(await fixture.fs.read(indexPath)).toEqual(indexBefore)
        return
      }
      await abortMerge(fixture)
      expect((await fixture.fs.lstat(filepath)).isFile()).toBe(true)
      expect((await fixture.fs.read(filepath)).toString()).toBe('old-target')
      await GitIndexManager.acquire(
        {
          fs: fixture.fs,
          gitdir: fixture.gitdirsmfullpath || fixture.gitdir,
          cache: {},
        },
        index => {
          expect(index.entriesMap.get('alias').mode).toBe(0o120000)
        }
      )
    })
  }

  for (const nonBlocking of [false, true]) {
    for (const originalType of ['file', 'symlink']) {
      for (const failure of [
        'symlink',
        'rename',
        'install',
        'missing-rename',
      ]) {
        it(`preserves the destination after checkout failure (nonBlocking=${nonBlocking}, type=${originalType}, failure=${failure})`, async () => {
          const fixture = await prepare(makeFixture, {
            base: { alias: file('local-target', '120000') },
            ours: { alias: file('local-target', '120000') },
            theirs: { alias: file('remote-target', '120000') },
          })
          const filepath = `${fixture.dir}/alias`
          if (originalType === 'file') {
            await fixture.fs.rm(filepath)
            await fixture.fs.write(filepath, 'Keep my draft')
          }
          const namesBefore = await fixture.fs.readdir(fixture.dir)
          const indexPath = `${fixture.gitdirsmfullpath || fixture.gitdir}/index`
          const indexBefore = await fixture.fs.read(indexPath)
          const error = Object.assign(new Error('Injected failure'), {
            code: 'EACCES',
          })
          if (failure === 'symlink') {
            fixture.fs.writelink = async function () {
              throw error
            }
          } else if (failure === 'rename') {
            fixture.fs._rename = async function () {
              throw error
            }
          } else if (failure === 'install') {
            const rename = fixture.fs._rename
            fixture.fs._rename = async function (oldpath, newpath) {
              if (oldpath.endsWith('/replacement') && newpath === filepath)
                throw error
              await rename(oldpath, newpath)
            }
          } else {
            fixture.fs._rename = undefined
          }
          await expect(
            checkout({ ...fixture, ref: 'incoming', force: true, nonBlocking })
          ).rejects.toMatchObject({ code: Errors.MultipleGitError.code })
          expect(await fixture.fs.readdir(fixture.dir)).toEqual(namesBefore)
          expect(await fixture.fs.read(indexPath)).toEqual(indexBefore)
          if (originalType === 'symlink') {
            expect((await fixture.fs.readlink(filepath)).toString()).toBe(
              'local-target'
            )
          } else {
            expect((await fixture.fs.lstat(filepath)).isFile()).toBe(true)
            expect((await fixture.fs.read(filepath)).toString()).toBe(
              'Keep my draft'
            )
          }
        })
      }
    }

    it(`retains an accessible original if installation and rollback fail (nonBlocking=${nonBlocking})`, async () => {
      const fixture = await prepare(makeFixture, {
        base: { alias: file('local-target', '120000') },
        ours: { alias: file('local-target', '120000') },
        theirs: { alias: file('remote-target', '120000') },
      })
      const filepath = `${fixture.dir}/alias`
      const indexPath = `${fixture.gitdirsmfullpath || fixture.gitdir}/index`
      const indexBefore = await fixture.fs.read(indexPath)
      const rename = fixture.fs._rename
      const error = Object.assign(new Error('Installation and rollback fail'), {
        code: 'EACCES',
      })
      fixture.fs._rename = async function (oldpath, newpath) {
        if (newpath === filepath) throw error
        await rename(oldpath, newpath)
      }
      let recoveryPath
      try {
        await checkout({
          ...fixture,
          ref: 'incoming',
          force: true,
          nonBlocking,
        })
        throw new Error('Expected checkout to fail')
      } catch (failure) {
        expect(failure.code).toBe(Errors.MultipleGitError.code)
        const recoveryError = failure.errors[0]
        expect(recoveryError.code).toBe('InternalError')
        expect(recoveryError.errors).toEqual([error, error])
        recoveryPath = recoveryError.data.recoveryPath
      }
      expect((await fixture.fs.readlink(recoveryPath)).toString()).toBe(
        'local-target'
      )
      expect(await fixture.fs.read(indexPath)).toEqual(indexBefore)
      expect(
        await fixture.fs.readdir(
          recoveryPath.slice(0, recoveryPath.lastIndexOf('/'))
        )
      ).toEqual(['original'])
      await rename(recoveryPath, filepath)
    })

    it(`preserves the primary error and attempts directory cleanup after unlink fails (nonBlocking=${nonBlocking})`, async () => {
      const fixture = await prepare(makeFixture, {
        base: { alias: file('local-target', '120000') },
        ours: { alias: file('local-target', '120000') },
        theirs: { alias: file('remote-target', '120000') },
      })
      const filepath = `${fixture.dir}/alias`
      const namesBefore = await fixture.fs.readdir(fixture.dir)
      const operationError = Object.assign(
        new Error('Symlink creation failed'),
        { code: 'EACCES', cleanupErrors: /** @type {Error[]} */ ([]) }
      )
      const cleanupError = Object.assign(new Error('Unlink failed'), {
        code: 'EACCES',
      })
      const unlink = fixture.fs._unlink
      fixture.fs._unlink = async function (path) {
        if (path.endsWith('/replacement')) throw cleanupError
        await unlink(path)
      }
      fixture.fs.writelink = async function () {
        throw operationError
      }
      await expect(
        checkout({ ...fixture, ref: 'incoming', force: true, nonBlocking })
      ).rejects.toMatchObject({
        code: Errors.MultipleGitError.code,
        errors: [operationError],
      })
      expect(operationError.cleanupErrors).toEqual([cleanupError])
      expect(await fixture.fs.readdir(fixture.dir)).toEqual(namesBefore)
      expect((await fixture.fs.readlink(filepath)).toString()).toBe(
        'local-target'
      )
    })

    for (const force of [false, true]) {
      it(`protects a regular-file edit matching an incoming symlink's bytes (nonBlocking=${nonBlocking}, force=${force})`, async () => {
        const fixture = await prepare(makeFixture, {
          base: { alias: file('local-target') },
          ours: { alias: file('local-target') },
          theirs: { alias: file('edited-target', '120000') },
        })
        const filepath = `${fixture.dir}/alias`
        await fixture.fs.write(filepath, 'edited-target')
        const result = checkout({
          ...fixture,
          ref: 'incoming',
          nonBlocking,
          force,
        })
        if (force) {
          await result
          expect((await fixture.fs.readlink(filepath)).toString()).toBe(
            'edited-target'
          )
        } else {
          await expect(result).rejects.toMatchObject({
            code: Errors.CheckoutConflictError.code,
            data: { filepaths: ['alias'] },
          })
          expect((await fixture.fs.lstat(filepath)).isFile()).toBe(true)
          expect((await fixture.fs.read(filepath)).toString()).toBe(
            'edited-target'
          )
        }
      })
    }

    for (const operation of ['update', 'delete']) {
      for (const force of [false, true]) {
        it(`handles a local symlink-to-file change during checkout ${operation} (nonBlocking=${nonBlocking}, force=${force})`, async () => {
          const fixture = await prepare(makeFixture, {
            base: { alias: file('local-target', '120000') },
            ours: { alias: file('local-target', '120000') },
            theirs:
              operation === 'delete'
                ? {}
                : { alias: file('remote-target', '120000') },
          })
          const filepath = `${fixture.dir}/alias`
          await setConfig({ ...fixture, path: 'core.symlinks', value: true })
          await fixture.fs.rm(filepath)
          await fixture.fs.write(filepath, 'local-target')

          const result = checkout({
            ...fixture,
            ref: 'incoming',
            force,
            nonBlocking,
          })
          if (force) {
            await result
            if (operation === 'delete') {
              expect(await fixture.fs.exists(filepath)).toBe(false)
            } else {
              expect((await fixture.fs.readlink(filepath)).toString()).toBe(
                'remote-target'
              )
            }
          } else {
            await expect(result).rejects.toMatchObject({
              code: Errors.CheckoutConflictError.code,
              data: { filepaths: ['alias'] },
            })
            expect((await fixture.fs.lstat(filepath)).isFile()).toBe(true)
            expect((await fixture.fs.read(filepath)).toString()).toBe(
              'local-target'
            )
            await GitIndexManager.acquire(
              {
                fs: fixture.fs,
                gitdir: fixture.gitdirsmfullpath || fixture.gitdir,
                cache: {},
              },
              index => {
                expect(index.entriesMap.get('alias').mode).toBe(0o120000)
              }
            )
          }
        })
      }
    }

    for (const operation of ['update', 'delete']) {
      for (const { target, content, autocrlf } of [
        { target: 'local-target', content: 'local-target', autocrlf: false },
        { target: 'local-target', content: 'edited-target', autocrlf: false },
        { target: 'local-target', content: 'remote-target', autocrlf: false },
        {
          target: 'local\r\ntarget',
          content: 'local\r\ntarget',
          autocrlf: true,
        },
        { target: 'local\ntarget', content: 'local\r\ntarget', autocrlf: true },
      ]) {
        it(`handles a symlink stub during checkout ${operation} (nonBlocking=${nonBlocking}, clean=${target === content}, incoming=${content === 'remote-target'}, autocrlf=${autocrlf})`, async () => {
          const fixture = await prepare(makeFixture, {
            base: { alias: file(target, '120000') },
            ours: { alias: file(target, '120000') },
            theirs:
              operation === 'delete'
                ? {}
                : { alias: file('remote-target', '120000') },
          })
          await setConfig({ ...fixture, path: 'core.symlinks', value: false })
          await setConfig({
            ...fixture,
            path: 'core.autocrlf',
            value: autocrlf,
          })
          const filepath = `${fixture.dir}/alias`
          await fixture.fs.rm(filepath)
          await fixture.fs.write(filepath, content)
          const indexPath = `${fixture.gitdirsmfullpath || fixture.gitdir}/index`
          const index = await fixture.fs.read(indexPath)
          const options = { ...fixture, ref: 'incoming', nonBlocking }
          const canCheckout =
            content === target ||
            (operation === 'update' && content === 'remote-target')
          const result = checkout({ ...options, dryRun: true })
          if (canCheckout) {
            await result
          } else {
            await expect(result).rejects.toMatchObject({
              code: Errors.CheckoutConflictError.code,
              data: { filepaths: ['alias'] },
            })
          }
          expect(await fixture.fs.read(indexPath)).toEqual(index)
          expect((await fixture.fs.lstat(filepath)).isFile()).toBe(true)
          expect((await fixture.fs.read(filepath)).toString()).toBe(content)
          if (canCheckout) {
            await checkout(options)
            if (operation === 'delete') {
              expect(await fixture.fs.exists(filepath)).toBe(false)
            } else {
              expect((await fixture.fs.readlink(filepath)).toString()).toBe(
                'remote-target'
              )
            }
          }
        })
      }
    }

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
