import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import { tmpdir } from './__helpers__'

describe('list', () => {
  test('list', async () => {
    let dir = await tmpdir()
    await pify(ncp)('__tests__/__fixtures__/test-list.git', dir)
    const files = await git()
      .gitdir(dir)
      .list()
    expect(files).toMatchSnapshot()
  })
})
