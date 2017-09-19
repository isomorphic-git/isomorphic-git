import test from 'ava'
import listCommits from '../lib/commands/listCommits'

test('listCommits', async t => {
  let commits = await listCommits({
    gitdir: 'fixtures/test-listCommits.git',
    start: ['c60bbbe99e96578105c57c4b3f2b6ebdf863edbc'],
    finish: ['c77052f99c33dbe3d2a120805fcebe9e2194b6f9']
  })
  t.snapshot(commits)
})
