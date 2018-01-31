/* global test describe expect */
import _fs from 'fs'
import { createTempDir } from 'jest-fixtures'
import { models, utils } from '../dist/for-node/internal-apis'
const { FileSystem } = models
const { sleep } = utils
const fs = new FileSystem(_fs)

describe('lockfile', () => {
  test('make lockfile', async () => {
    let dir = await createTempDir()
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
  })

  test('cannot double-acquire lockfile', async () => {
    let dir = await createTempDir()
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
    try {
      await fs.lock(dir)
      throw new Error('Double-acquired lock')
    } catch (err) {}
  })

  test('can release lockfile', async () => {
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

  test('cannot double-release lockfile', async () => {
    let dir = await createTempDir()
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
    await fs.unlock(dir)
    try {
      await fs.unlock(dir)
      throw new Error('Was able to double-release lockfile')
    } catch (err) {}
  })

  test('can retry until acquire lockfile', async () => {
    let dir = await createTempDir()
    await fs.lock(dir)
    expect(await fs.exists(`${dir}.lock`)).toBe(true)
    setTimeout(() => fs.rm(`${dir}.lock`), 100)
    try {
      await fs.lock(dir)
    } catch (err) {
      throw new Error('Could not acquire lock even after lockfile deleted.')
    }
  })
})
