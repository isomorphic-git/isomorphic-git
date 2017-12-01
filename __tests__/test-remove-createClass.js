/* global test describe expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'
import { createClass } from '../dist/for-node/utils'
import { remove, list } from '../dist/for-node/commands'

const Git = createClass({ remove, list })

describe('remove', () => {
  test('file', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-remove.git')
    // Test
    const repo = new Git({ fs, gitdir })
    let before = await repo.list()
    expect(before).toMatchSnapshot()
    await repo.remove({ filepath: 'LICENSE.md' })
    let after = await repo.list()
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 1).toBe(true)
  })

  test('dir', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-remove.git')
    // Test
    const repo = new Git({ fs, gitdir })
    let before = await repo.list()
    expect(before).toMatchSnapshot()
    await repo.remove({ filepath: 'src/models' })
    let after = await repo.list()
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 5).toBe(true)
  })
})
