import git from '..'
import { existsSync } from 'fs'
import { createTempDir } from 'jest-fixtures'

describe('init', () => {
  test('init', async () => {
    let dir = await createTempDir()
    await git(dir).init()
    expect(existsSync(dir)).toBe(true)
    expect(existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(existsSync(`${dir}/.git/refs/heads`)).toBe(true)
    expect(existsSync(`${dir}/.git/HEAD`)).toBe(true)
  })
})
