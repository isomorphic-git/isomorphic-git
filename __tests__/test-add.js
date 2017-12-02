/* globals describe test expect */
import fs from 'fs'
import { Git } from '..'
import { copyFixtureIntoTempDir } from 'jest-fixtures'
import { init, add, list } from '../dist/for-node/commands'

describe('add', () => {
  test('file', async () => {
    // Setup
    let dir = await copyFixtureIntoTempDir(__dirname, 'test-add')
    // Test
    const repo = new Git({ fs, dir })
    await init(repo)
    let orig = (await list(repo)).length
    await add(repo, { filepath: 'a.txt' })
    expect((await list(repo)).length === 1).toBe(true)
    await add(repo, { filepath: 'a.txt' })
    expect((await list(repo)).length === 1).toBe(true)
    await add(repo, { filepath: 'a-copy.txt' })
    expect((await list(repo)).length === 2).toBe(true)
    await add(repo, { filepath: 'b.txt' })
    expect((await list(repo)).length === 3).toBe(true)
  })
})
