import test from 'ava'
import push from '../lib/commands/push'
import server from './_real-http-backend'
import nock from 'nock'
import git from '..'
import write from '../lib/utils/write'
import path from 'path'
import { mkdir } from '../lib/utils/mkdirs'
import { exists, tmpdir, cleanup } from './_helpers'

test.skip('push', async t => {
  // Setup
  let dir = await tmpdir()
  const { get, post } = server(dir)
  let gitdir = path.join(dir, 'foo.git')
  await mkdir(gitdir)
  let repo = git().gitdir(gitdir)
  await repo.init()
  await repo.setConfig('core.bare', true)
  await write(path.join(gitdir, 'git-daemon-export-ok'), '')
  console.log('gitdir =', gitdir)
  // await repo.setConfig('remote "origin".url', 'http://example.dev/test-push')
  t.true(exists(gitdir))
  t.true(exists(path.join(gitdir, 'objects')))
  t.true(exists(path.join(gitdir, 'refs/heads')))
  t.true(exists(path.join(gitdir, 'HEAD')))
  // Test
  nock('http://example.dev')
    // .get('/test-push.git/info/refs?service=git-receive-pack')
    .get(/.*/)
    .post(/.*/)
    .reply(200, get)
    .reply(200, post)

  let res = await push({
    gitdir: 'fixtures/test-push.git',
    ref: 'master',
    url: 'http://example.dev/foo.git'
  })
  console.log(res)
  t.truthy(res)
  t.true(res.status === 200)
  // await cleanup()
})

test('push (to Github)', async t => {
  let res = await git()
    .gitdir('fixtures/test-push.git')
    .githubToken(process.env.GITHUB_TOKEN)
    .remote('origin')
    .push('refs/heads/master')
  console.log(res)
  t.truthy(res)
  t.is(
    res,
    `000eunpack ok
0019ok refs/heads/master
00000000`
  )
})
