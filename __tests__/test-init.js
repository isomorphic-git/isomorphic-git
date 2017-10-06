import git from '..'
import { exists, tmpdir } from './__helpers__'

describe('init', () => {
  test('init', async () => {
    let dir = await tmpdir()
    await git(dir).init()
    expect(exists(dir)).toBe(true)
    expect(exists(`${dir}/.git/objects`)).toBe(true)
    expect(exists(`${dir}/.git/refs/heads`)).toBe(true)
    expect(exists(`${dir}/.git/HEAD`)).toBe(true)
  })
})
