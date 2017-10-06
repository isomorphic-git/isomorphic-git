import git from '..'
import { createTempDir } from 'jest-fixtures'
import { existsSync } from 'fs'

jest.setTimeout(30000)

describe('clone', () => {
  test('clone', async () => {
    let dir = await createTempDir()
    await git(`${dir}`)
      .depth(1)
      .branch('master')
      .clone(`https://github.com/wmhilton/isomorphic-git`)
    expect(existsSync(`${dir}`)).toBe(true)
    expect(existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(existsSync(`${dir}/.git/refs/remotes/origin/master`)).toBe(true)
  })
})
