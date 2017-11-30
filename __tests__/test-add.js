/* globals describe test expect */
import fs from 'fs'
import { Git } from '..'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

describe('add', () => {
  test('file', async () => {
    // Setup
    let dir = await copyFixtureIntoTempDir(__dirname, 'test-add')
    // Test
    const repo = new Git({ fs, dir })
    await repo.init()
    let orig = (await repo.list()).length
    await repo.add('a.txt')
    expect((await repo.list()).length === 1).toBe(true)
    await repo.add('a.txt')
    expect((await repo.list()).length === 1).toBe(true)
    await repo.add('a-copy.txt')
    expect((await repo.list()).length === 2).toBe(true)
    await repo.add('b.txt')
    expect((await repo.list()).length === 3).toBe(true)
  })
})
