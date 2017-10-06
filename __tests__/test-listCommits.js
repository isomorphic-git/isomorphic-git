import { listCommits } from '../dist/for-node/commands'

describe('listCommits', () => {
  test('listCommits', async () => {
    let commits = await listCommits({
      gitdir: '__tests__/__fixtures__/test-listCommits.git',
      start: ['c60bbbe99e96578105c57c4b3f2b6ebdf863edbc'],
      finish: ['c77052f99c33dbe3d2a120805fcebe9e2194b6f9']
    })
    expect(commits).toMatchSnapshot()
  })
})
