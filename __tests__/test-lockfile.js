/* global test describe expect */
const _fs = require('fs')
const { createTempDir } = require('jest-fixtures')
const { models, utils } = require('isomorphic-git/internal-apis')
const { FileSystem } = models
const { sleep } = utils
const fs = new FileSystem(_fs)

describe('lockfile', () => {
  it('make lockfile', async () => {
    let dir = await createTempDir()
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
  })

  it('cannot double-acquire lockfile', async () => {
    let dir = await createTempDir()
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
    let doubleAcquire = false
    try {
      await fs.lock(dir)
      doubleAcquire = true
    } catch (err) {}
    expect(doubleAcquire).toBe(false)
  })

  it('can release lockfile', async () => {
    let dir = await createTempDir()
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
    await fs.unlock(dir)
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
    await fs.unlock(dir)
    await sleep(100)
    expect(await fs.exists(`${dir}.lock`)).toBe(false)
  })

  it('cannot double-release lockfile', async () => {
    let dir = await createTempDir()
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
    await fs.unlock(dir)
    let doubleRelease = false
    try {
      await fs.unlock(dir)
      doubleRelease = true
    } catch (err) {}
    expect(doubleRelease).toBe(false)
  })

  it('can retry until acquire lockfile', async () => {
    let dir = await createTempDir()
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
    setTimeout(() => fs.unlock(dir), 100)
    let acquireLock = false
    try {
      await fs.lock(dir)
      acquireLock = true
    } catch (err) {}
    expect(acquireLock).toBe(true)
  })
})
