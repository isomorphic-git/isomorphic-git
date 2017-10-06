import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir } from './__helpers__'

describe('add', () => {
  test('file', async () => {
    // Setup
    let dir = await tmpdir()
    console.log('dir =', dir)
    await pify(ncp)('__tests__/__fixtures__/test-add', dir)
    // Test
    const repo = git(dir)
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
