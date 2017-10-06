import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir } from './__helpers__'

describe('remove', () => {
  test('file', async () => {
    // Setup
    let clientDir = await tmpdir()
    await pify(ncp)('__tests__/__fixtures__/test-remove.git', clientDir)
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
    let clientDir = await tmpdir()
    await pify(ncp)('__tests__/__fixtures__/test-remove.git', clientDir)
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
