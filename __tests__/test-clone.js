import git from '..'
import { exists, tmpdir } from './__helpers__'

jest.setTimeout(30000)

describe('clone', () => {
  test('clone', async () => {
    let dir = await tmpdir()
    await git(`${dir}`)
      .depth(1)
      .branch('master')
      .clone(`https://github.com/wmhilton/isomorphic-git`)
    expect(exists(`${dir}`)).toBe(true)
    expect(exists(`${dir}/.git/objects`)).toBe(true)
    expect(exists(`${dir}/.git/refs/remotes/origin/master`)).toBe(true)
  })
})
