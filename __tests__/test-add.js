/* globals describe test expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'
import { init, add, listFiles } from '../dist/for-node/commands'

/** @test {add} */
describe('add', () => {
  test('file', async () => {
    // Setup
    let dir = await copyFixtureIntoTempDir(__dirname, 'test-add')
    // Test
    const repo = { fs, dir }
    await init(repo)
    let orig = (await listFiles(repo)).length
    await add({ ...repo, filepath: 'a.txt' })
    expect((await listFiles(repo)).length === 1).toBe(true)
    await add({ ...repo, filepath: 'a.txt' })
    expect((await listFiles(repo)).length === 1).toBe(true)
    await add({ ...repo, filepath: 'a-copy.txt' })
    expect((await listFiles(repo)).length === 2).toBe(true)
    await add({ ...repo, filepath: 'b.txt' })
    expect((await listFiles(repo)).length === 3).toBe(true)
  })
})
