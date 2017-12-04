/* global test describe expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

import { Git } from '..'
import { remove, listFiles } from '../dist/for-node/commands'

/** @test {remove} */
describe('remove', () => {
  test('file', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-remove.git')
    // Test
    const repo = new Git({ fs, gitdir })
    let before = await listFiles(repo)
    expect(before).toMatchSnapshot()
    await remove(repo, { filepath: 'LICENSE.md' })
    let after = await listFiles(repo)
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 1).toBe(true)
  })

  test('dir', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-remove.git')
    // Test
    const repo = new Git({ fs, gitdir })
    let before = await listFiles(repo)
    expect(before).toMatchSnapshot()
    await remove(repo, { filepath: 'src/models' })
    let after = await listFiles(repo)
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 5).toBe(true)
  })
})
