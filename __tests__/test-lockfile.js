import fs from 'fs'
import { existsSync } from 'fs'
import { lock, unlock, sleep } from '../dist/for-node/utils'
import { createTempDir } from 'jest-fixtures'

describe('lockfile', () => {
  test('make lockfile', async () => {
    let dir = await createTempDir()
    await lock(dir)
    expect(existsSync(`${dir}.lock`)).toBe(true)
  })

  test('cannot double-acquire lockfile', async () => {
    let dir = await createTempDir()
    await lock(dir)
    expect(existsSync(`${dir}.lock`)).toBe(true)
    try {
      await lock(dir)
      throw new Error('Double-acquired lock')
    } catch (err) {}
  })

  test('can release lockfile', async () => {
    let dir = await createTempDir()
    await lock(dir)
    expect(existsSync(`${dir}.lock`)).toBe(true)
    await unlock(dir)
    await lock(dir)
    expect(existsSync(`${dir}.lock`)).toBe(true)
    await unlock(dir)
    await sleep(100)
    expect(existsSync(`${dir}.lock`)).toBe(false)
  })

  test('cannot double-release lockfile', async () => {
    let dir = await createTempDir()
    await lock(dir)
    expect(existsSync(`${dir}.lock`)).toBe(true)
    await unlock(dir)
    try {
      await unlock(dir)
      throw new Error('Was able to double-release lockfile')
    } catch (err) {}
  })

  test('can retry until acquire lockfile', async () => {
    let dir = await createTempDir()
    await lock(dir)
    expect(existsSync(`${dir}.lock`)).toBe(true)
    setTimeout(() => fs.rmdir(`${dir}.lock`), 100)
    try {
      await lock(dir)
    } catch (err) {
      throw new Error('Could not acquire lock even after lockfile deleted.')
    }
  })
})
