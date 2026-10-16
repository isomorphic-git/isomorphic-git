/* eslint-env node, browser, jasmine, jest */
import {
  Errors,
  add,
  branch,
  checkout,
  commit,
  currentBranch,
  getConfig,
  init,
  isIgnored,
  listBranches,
  listFiles,
  listNotes,
  log,
  readObject,
  resetIndex,
  resolveRef,
  setConfig,
  status,
} from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'
import { makeFailingFS } from './__helpers__/makeFailingFS.js'

const author = {
  name: 'Mr. Test',
  email: 'mrtest@example.com',
  timestamp: 1262356920,
  timezoneOffset: -0,
}

const posix = p => p.replace(/\\/g, '/')

// join() turns Windows backslashes into slashes, so a fixture path with
// backslashes would never match the paths the fs sees.
async function makePosixFixture(name) {
  const fixture = await makeFixture(name)
  return { ...fixture, dir: posix(fixture.dir), gitdir: posix(fixture.gitdir) }
}

async function makeRepo() {
  const { _fs, fs, dir, gitdir } = await makePosixFixture(
    'test-FileSystem-read-errors'
  )
  await init({ fs, dir, gitdir, defaultBranch: 'main' })
  await fs.write(`${dir}/a.txt`, 'a')
  await fs.write(`${dir}/b.txt`, 'b')
  await add({ fs, dir, gitdir, filepath: ['a.txt', 'b.txt'] })
  const oid = await commit({ fs, dir, gitdir, author, message: 'first' })
  return { _fs, fs, dir, gitdir, oid }
}

// LightningFS resolves a directory read to undefined instead of EISDIR.
function makeUndefinedDirectoryReadsFS(_fs) {
  const fs = makeFailingFS(_fs, () => false)
  const readFile = fs.promises.readFile
  fs.promises.readFile = async (filepath, ...args) => {
    const stats = await _fs.promises.stat(filepath).catch(() => null)
    if (stats && stats.isDirectory()) return undefined
    return readFile(filepath, ...args)
  }
  return fs
}

async function rejection(promise) {
  try {
    await promise
  } catch (err) {
    return err
  }
  return null
}

describe('FileSystem read errors', () => {
  it('commit fails without writing when the index cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir, oid } = await makeRepo()
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/index`)
    // Test
    const error = await rejection(
      commit({ fs: failing, dir, gitdir, author, message: 'second' })
    )
    expect(error && error.code).toBe('EIO')
    expect(await resolveRef({ fs, gitdir, ref: 'main' })).toBe(oid)
    expect(await listFiles({ fs, gitdir, ref: 'main' })).toEqual([
      'a.txt',
      'b.txt',
    ])
  })

  it('add fails without writing when the index cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir } = await makeRepo()
    await fs.write(`${dir}/c.txt`, 'c')
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/index`)
    // Test
    const error = await rejection(
      add({ fs: failing, dir, gitdir, filepath: 'c.txt' })
    )
    expect(error && error.code).toBe('EIO')
    expect(await listFiles({ fs, gitdir })).toEqual(['a.txt', 'b.txt'])
  })

  it('commit fails without writing when the branch ref cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir, oid } = await makeRepo()
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/refs/heads/main`)
    // Test
    const error = await rejection(
      commit({ fs: failing, dir, gitdir, author, message: 'second' })
    )
    expect(error && error.code).toBe('EIO')
    expect(await resolveRef({ fs, gitdir, ref: 'main' })).toBe(oid)
    expect(await log({ fs, gitdir, ref: 'main' })).toHaveLength(1)
  })

  it('branch fails without writing when the existing ref cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir, oid } = await makeRepo()
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/refs/heads/main`)
    // Test
    const error = await rejection(
      branch({ fs: failing, dir, gitdir, ref: 'other', object: 'main' })
    )
    expect(error && error.code).toBe('EIO')
    expect(await resolveRef({ fs, gitdir, ref: 'main' })).toBe(oid)
    expect(
      (await rejection(resolveRef({ fs, gitdir, ref: 'other' }))).code
    ).toBe(Errors.NotFoundError.code)
  })

  it('branch fails without writing when packed-refs cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir } = await makeRepo()
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/packed-refs`)
    // Test
    const error = await rejection(
      branch({ fs: failing, dir, gitdir, ref: 'other' })
    )
    expect(error && error.code).toBe('EIO')
    expect(
      (await rejection(resolveRef({ fs, gitdir, ref: 'other' }))).code
    ).toBe(Errors.NotFoundError.code)
  })

  it('checkout fails without moving the branch when its ref cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir, oid } = await makeRepo()
    await fs.write(`${gitdir}/refs/remotes/origin/main`, `${oid}\n`)
    await fs.write(`${dir}/a.txt`, 'a2')
    await add({ fs, dir, gitdir, filepath: 'a.txt' })
    const second = await commit({ fs, dir, gitdir, author, message: 'second' })
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/refs/heads/main`)
    // Test
    const error = await rejection(
      checkout({ fs: failing, dir, gitdir, ref: 'main', noCheckout: true })
    )
    expect(error && error.code).toBe('EIO')
    expect(await resolveRef({ fs, gitdir, ref: 'main' })).toBe(second)
  })

  it('resetIndex fails without dropping the file when HEAD cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir } = await makeRepo()
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/refs/heads/main`)
    // Test
    const error = await rejection(
      resetIndex({ fs: failing, dir, gitdir, filepath: 'a.txt' })
    )
    expect(error && error.code).toBe('EIO')
    expect(await listFiles({ fs, gitdir })).toEqual(['a.txt', 'b.txt'])
  })

  it('resetIndex fails without dropping the file when a tree cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir } = await makeRepo()
    const failing = makeFailingFS(_fs, p => p.startsWith(`${gitdir}/objects/`))
    // Test
    const error = await rejection(
      resetIndex({ fs: failing, dir, gitdir, filepath: 'a.txt' })
    )
    expect(error && error.code).toBe('EIO')
    expect(await listFiles({ fs, gitdir })).toEqual(['a.txt', 'b.txt'])
  })

  it('still resets a path that runs through a file in HEAD', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeRepo()
    // Test
    await resetIndex({ fs, dir, gitdir, filepath: 'a.txt/x' })
    expect(await listFiles({ fs, gitdir })).toEqual(['a.txt', 'b.txt'])
  })

  it('currentBranch fails when the branch ref cannot be read', async () => {
    // Setup
    const { _fs, dir, gitdir } = await makeRepo()
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/refs/heads/main`)
    // Test
    const error = await rejection(
      currentBranch({ fs: failing, dir, gitdir, test: true })
    )
    expect(error && error.code).toBe('EIO')
  })

  it('listNotes fails when the notes ref cannot be read', async () => {
    // Setup
    const { _fs, gitdir } = await makePosixFixture('test-listNotes')
    const failing = makeFailingFS(
      _fs,
      p => p === `${gitdir}/refs/notes/commits`
    )
    // Test
    const error = await rejection(listNotes({ fs: failing, gitdir }))
    expect(error && error.code).toBe('EIO')
  })

  it('status fails when the branch ref cannot be read', async () => {
    // Setup
    const { _fs, dir, gitdir } = await makeRepo()
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/refs/heads/main`)
    // Test
    const error = await rejection(
      status({ fs: failing, dir, gitdir, filepath: 'a.txt' })
    )
    expect(error && error.code).toBe('EIO')
  })

  it('status fails when the index cannot be reread to refresh its stats', async () => {
    // Setup
    const { _fs, dir, gitdir } = await makeRepo()
    const later = new Date(Date.now() + 60_000)
    await _fs.promises.utimes(`${dir}/a.txt`, later, later)
    let failIndex = false
    const failing = makeFailingFS(
      _fs,
      p => failIndex && p === `${gitdir}/index`
    )
    // Another process rewrites the index while status hashes the file.
    const readFile = failing.promises.readFile
    failing.promises.readFile = async (filepath, ...args) => {
      if (filepath === `${dir}/a.txt`) {
        const index = await _fs.promises.readFile(`${gitdir}/index`)
        await _fs.promises.writeFile(`${gitdir}/index`, index)
        await _fs.promises.utimes(`${gitdir}/index`, later, later)
        failIndex = true
      }
      return readFile(filepath, ...args)
    }
    // Test
    const error = await rejection(
      status({ fs: failing, dir, gitdir, filepath: 'a.txt' })
    )
    expect(error && error.code).toBe('EIO')
  })

  it('setConfig fails without writing when the config cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir } = await makeRepo()
    const url = 'https://example.com/repo.git'
    await setConfig({ fs, dir, gitdir, path: 'remote.origin.url', value: url })
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/config`)
    // Test
    const error = await rejection(
      setConfig({ fs: failing, dir, gitdir, path: 'user.name', value: 'x' })
    )
    expect(error && error.code).toBe('EIO')
    expect(
      await getConfig({ fs, dir, gitdir, path: 'remote.origin.url' })
    ).toBe(url)
  })

  it('isIgnored fails when a .gitignore cannot be read', async () => {
    // Setup
    const { _fs, fs, dir, gitdir } = await makeRepo()
    await fs.write(`${dir}/.gitignore`, 'secret.txt\n')
    const failing = makeFailingFS(_fs, p => p === `${dir}/.gitignore`)
    // Test
    const error = await rejection(
      isIgnored({ fs: failing, dir, gitdir, filepath: 'secret.txt' })
    )
    expect(error && error.code).toBe('EIO')
  })

  it('readObject fails when the pack directory cannot be listed', async () => {
    // Setup
    const { _fs, gitdir } = await makePosixFixture('test-readObject')
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/objects/pack`)
    // Test
    const error = await rejection(
      readObject({
        fs: failing,
        gitdir,
        oid: '0001c3e2753b03648b6c43dd74ba7fe2f21123d6',
      })
    )
    expect(error && error.code).toBe('EIO')
  })

  it('listBranches rejects only through its promise when packed-refs cannot be read', async () => {
    // Setup
    const { _fs, gitdir } = await makePosixFixture('test-listBranches')
    const failing = makeFailingFS(_fs, p => p === `${gitdir}/packed-refs`)
    // Finish the loose ref scan after the packed-refs read has failed, so
    // a rejection nobody awaits yet fails the test as unhandled.
    if (globalThis.jest) jest.useRealTimers()
    const readdir = failing.promises.readdir
    failing.promises.readdir = async (...args) => {
      await new Promise(resolve => setTimeout(resolve, 50))
      return readdir(...args)
    }
    // Test
    const error = await rejection(listBranches({ fs: failing, gitdir }))
    expect(error && error.code).toBe('EIO')
  })

  it('readObject retries a pack read that failed with the same cache', async () => {
    // Setup
    const { _fs, gitdir } = await makePosixFixture('test-readObject')
    let fail = true
    const failing = makeFailingFS(_fs, p => fail && p.endsWith('.pack'))
    const cache = {}
    const oid = '0b8faa11b353db846b40eb064dfb299816542a46'
    // Test
    const error = await rejection(
      readObject({ fs: failing, cache, gitdir, oid })
    )
    expect(error && error.code).toBe('EIO')
    fail = false
    const object = await readObject({ fs: failing, cache, gitdir, oid })
    expect(object.oid).toBe(oid)
  })

  it('readObject retries a pack index read that failed with the same cache', async () => {
    // Setup
    const { _fs, gitdir } = await makePosixFixture('test-readObject')
    let fail = true
    const failing = makeFailingFS(_fs, p => fail && p.endsWith('.idx'))
    const cache = {}
    const oid = '0b8faa11b353db846b40eb064dfb299816542a46'
    // Test
    const error = await rejection(
      readObject({ fs: failing, cache, gitdir, oid })
    )
    expect(error && error.code).toBe('EIO')
    fail = false
    const object = await readObject({ fs: failing, cache, gitdir, oid })
    expect(object.oid).toBe(oid)
  })

  it('getConfig rethrows an error with a numeric code unchanged', async () => {
    // Setup
    const { _fs, dir, gitdir } = await makeRepo()
    const abort = Object.assign(new Error('The transaction was aborted.'), {
      name: 'AbortError',
      code: 20,
    })
    const failing = makeFailingFS(
      _fs,
      p => p === `${gitdir}/config`,
      () => abort
    )
    // Test
    const error = await rejection(
      getConfig({ fs: failing, dir, gitdir, path: 'user.name' })
    )
    expect(error).toBe(abort)
  })

  it('still resolves a remote HEAD when a directory read returns undefined', async () => {
    // Setup
    const { _fs, fs, gitdir, oid } = await makeRepo()
    await fs.write(`${gitdir}/refs/remotes/origin/main`, `${oid}\n`)
    await fs.write(
      `${gitdir}/refs/remotes/origin/HEAD`,
      'ref: refs/remotes/origin/main\n'
    )
    const lightning = makeUndefinedDirectoryReadsFS(_fs)
    // Test
    expect(await resolveRef({ fs: lightning, gitdir, ref: 'origin' })).toBe(oid)
  })

  it('still treats a ref path that is a directory as missing', async () => {
    // Setup
    const { fs, gitdir, oid } = await makeRepo()
    await fs.write(`${gitdir}/refs/remotes/origin/main`, `${oid}\n`)
    // Test
    expect(
      (await rejection(resolveRef({ fs, gitdir, ref: 'origin' }))).code
    ).toBe(Errors.NotFoundError.code)
    expect(await resolveRef({ fs, gitdir, ref: 'origin/main' })).toBe(oid)
  })

  it('still treats a ref path through a file as missing', async () => {
    // Setup
    const { fs, gitdir } = await makeRepo()
    // Test
    expect(
      (await rejection(resolveRef({ fs, gitdir, ref: 'main/x' }))).code
    ).toBe(Errors.NotFoundError.code)
  })
})
