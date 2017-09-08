process.env.TZ = 'utc'
import test from 'ava'
import git from '../lib'
import read from '../lib/utils/read'
import write from '../lib/utils/write'
import rm from '../lib/utils/delete'

test('git.commit()', async t => {
  const repo = git()
  repo.gitdir('fixtures/test-commit.git')
  await repo.init()
  await write('fixtures/test-commit.git/index', await read('fixtures/test-commit/index-1'))
  await write('fixtures/test-commit.git/refs/heads/master', '1386e77b0a7afa8333663a9e4cbf8e6158e625c1\n')
  await write('fixtures/test-commit.git/HEAD', 'ref: refs/heads/master\n')
  repo.author('Mr. Test')
  repo.email('mrtest@example.com')
  repo.datetime(new Date('2010-01-01T09:42:00-05:00'))
  let sha = await repo.commit('Initial commit')
  t.true(sha === '2e5e61ba368ad58d3e7c51815fa673aea4c95443')
})
