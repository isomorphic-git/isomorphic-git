import git from '..'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

describe('remove', () => {
  test('file', async () => {
    // Setup
    let clientDir = await copyFixtureIntoTempDir(__dirname, 'test-remove.git')
    // Test
    const repo = git().gitdir(clientDir)
    let before = await repo.list()
    expect(before).toMatchSnapshot()
    await repo.remove('LICENSE.md')
    let after = await repo.list()
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 1).toBe(true)
  })

  test('dir', async () => {
    // Setup
    let clientDir = await copyFixtureIntoTempDir(__dirname, 'test-remove.git')
    // Test
    const repo = git().gitdir(clientDir)
    let before = await repo.list()
    expect(before).toMatchSnapshot()
    await repo.remove('src/models')
    let after = await repo.list()
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 5).toBe(true)
  })
})
