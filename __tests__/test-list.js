import git from '..'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

describe('list', () => {
  test('list', async () => {
    let dir = await copyFixtureIntoTempDir(__dirname, 'test-list.git')
    const files = await git()
      .gitdir(dir)
      .list()
    expect(files).toMatchSnapshot()
  })
})
