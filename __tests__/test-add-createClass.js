/* globals describe test expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'
import { createClass } from '../dist/for-node/utils'
import { init, add, list } from '../dist/for-node/commands'

const Git = createClass({ init, add, list })

describe('add', () => {
  test('file', async () => {
    // Setup
    let dir = await copyFixtureIntoTempDir(__dirname, 'test-add')
    // Test
    const repo = new Git({ fs, dir })
    await repo.init()
    let orig = (await repo.list()).length
    await repo.add({ filepath: 'a.txt' })
    expect((await repo.list()).length === 1).toBe(true)
    await repo.add({ filepath: 'a.txt' })
    expect((await repo.list()).length === 1).toBe(true)
    await repo.add({ filepath: 'a-copy.txt' })
    expect((await repo.list()).length === 2).toBe(true)
    await repo.add({ filepath: 'b.txt' })
    expect((await repo.list()).length === 3).toBe(true)
  })
})
